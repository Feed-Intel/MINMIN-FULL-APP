from django.db.models import Avg
from rest_framework import viewsets, status
from django.core.exceptions import ValidationError
from accounts.permissions import HasCustomAPIKey
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from rest_framework.response import Response
import rest_framework.status as Status
from django.utils import timezone
from django.db.models import Q, Sum, Count, Avg, Prefetch
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied
from django.contrib.gis.db.models.functions import Distance
from .models import Tenant
from restaurant.menu.models import Menu
from customer.order.models import Order
from customer.payment.models import Payment
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.gis.geos import Point
from .serializers import TenantSerializer
from .tenantFilter import TenantFilter
from restaurant.table.models import Table
from restaurant.branch.models import Branch
from customer.feedback.models import Feedback
from restaurant.menu.models import Menu
from core.redis_client import redis_client
from datetime import timedelta
from django.db.models.functions import ExtractHour, ExtractWeek, ExtractMonth
from django.db.models import ExpressionWrapper, F, IntegerField
from .serializers import DashboardSerializer
from django.db.models.functions import TruncDate
from core.cache import CachedModelViewSet
class TenantPagination(PageNumberPagination):
    page_size = 10

class TenantView(CachedModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = TenantFilter
    pagination_class = TenantPagination

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:  # Actions that use get_queryset
            # Remove IsAdminOrRestaurant for these actions
            return [permission() for permission in [IsAuthenticated, HasCustomAPIKey]]
        else:
            # Use default permissions for other actions
            return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        # Get the currently authenticated user
        user = self.request.user
        user_location = redis_client.get(str(user.id))
        if user.user_type == 'customer':
            branches_qs = Branch.objects.all()
            if user_location:
                latitude_str, longitude_str = user_location.split(',')
                latitude = float(latitude_str)
                longitude = float(longitude_str)
                user_location = Point(longitude, latitude, srid=4326)
                branches_qs = branches_qs.annotate(distance=Distance('location', user_location))

            queryset = Tenant.objects.prefetch_related(
                Prefetch('branches', queryset=branches_qs),
                'menus'
            )
        else:
            queryset =  Tenant.objects.filter(admin=user).prefetch_related('menus',
            'branches__tables')
        return queryset
    
    def perform_create(self, serializer):
        return serializer.save(admin=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='dashboard')
    def get_dashboard(self, request):
        user = request.user
        tenant = user.tenants

        cache_key = f"tenant_dashboard:{user.id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)
        
        # Base query filters
        order_filter = Q(tenant=tenant)
        table_filter = Q(branch__tenant=tenant)
        feedback_filter = Q(restaurant=tenant)
        
        if user.user_type == 'branch_staff':
            order_filter &= Q(branch=user.branch)
            table_filter &= Q(branch=user.branch)
            feedback_filter &= Q(order__branch=user.branch)

        # Order statistics
        orders = Order.objects.filter(order_filter)
        total_orders = orders.count()
        
        # Revenue calculations (assuming Payment model exists with amount_paid field)
        total_revenue = Payment.objects.filter(order__in=orders).aggregate(
            total=Sum('amount_paid')
        )['total'] or 0
        
        # Active tables (tables with active orders)
        active_tables = Table.objects.filter(table_filter).filter(
            table_order__status__in=['pending_payment', 'placed', 'progress']
        ).distinct().count()

        # Customer ratings from feedback
        rating_info = Feedback.objects.filter(feedback_filter).aggregate(
            avg_rating=Avg('service_rating'),
            total_reviews=Count('id')
        )
        
        # Today's metrics
        today = timezone.now().date()
        today_orders = orders.filter(created_at__date=today)
        today_revenue = Payment.objects.filter(
            order__in=today_orders
        ).aggregate(total=Sum('amount_paid'))['total'] or 0

        # Order status breakdown
        status_counts = orders.values('status').annotate(count=Count('id'))

        # Menu statistics
        menu_stats = Menu.objects.filter(tenant=tenant).aggregate(
            total_menus=Count('id'),
            average_price=Avg('price')
        )

        response_data = {
            "tenant_name": tenant.restaurant_name,
            "total_menus": menu_stats['total_menus'],
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "active_tables": active_tables,
            "customer_rating": round(rating_info['avg_rating'] or 0, 1),
            "total_reviews": rating_info['total_reviews'],
            "today_revenue": float(today_revenue),
            "average_order_value": float(total_revenue / total_orders) if total_orders > 0 else 0,
            "order_statuses": {item['status']: item['count'] for item in status_counts},
            "menu_stats": {
                "average_price": float(menu_stats['average_price'] or 0),
                "total_items": menu_stats['total_menus']
            },
            "table_orders": orders.exclude(
                status__in=['delivered', 'cancelled', 'payment_complete']
            ).count()
        }

        cache.set(cache_key, response_data, 300)

        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='price-stats')
    def get_price_stats(self, request):
        """
        Custom action to find the cheapest, expensive, and middle restaurants based on average menu prices.
        """
        # Annotate each tenant with their average menu price and exclude those without menus
        tenants = self.get_queryset().annotate(
            avg_price=Avg('menus__price')
        ).exclude(avg_price__isnull=True).order_by('avg_price')

        count = tenants.count()
        if count == 0:
            return Response({"message": "No restaurants with menus found."}, status=Status.HTTP_404_NOT_FOUND)

        # Determine cheapest, expensive, and middle restaurants
        cheapest = tenants.first()
        expensive = tenants.last()
        middle_index = count // 2
        middle = tenants[middle_index] if count > 0 else None

        # Helper function to serialize tenant data and include avg_price
        def serialize_tenant(tenant):
            if not tenant:
                return None
            data = self.get_serializer(tenant).data
            data['avg_price'] = float(tenant.avg_price)  # Convert Decimal to float for JSON compatibility
            return data

        response_data = {
            "cheapest": serialize_tenant(cheapest),
            "expensive": serialize_tenant(expensive),
            "middle": serialize_tenant(middle),
        }

        return Response(response_data, status=Status.HTTP_200_OK)

    def perform_update(self, serializer):
        if self.request.user.user_type == 'admin':
            serializer.save(admin=self.request.user)
        elif self.request.user.user_type == 'restaurant' and self.request.user.id == serializer.instance.admin.id:
            serializer.save(admin=self.request.user)
        else:
            raise PermissionDenied("You do not have permission to perform this action.")

        

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response({"message": "Tenant deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, HasCustomAPIKey]
    
    def _get_base_filters(self, user, branch_id=None):
        """
        Get base filters based on user type and branch_id
        """
        filters = Q()
        
        # For branch staff, only show their branch data
        if user.user_type == 'branch_staff':
            filters &= Q(branch=user.branch)
        # For restaurant admin, filter by branch if specified
        elif user.user_type == 'restaurant':
            if branch_id:
                try:
                    branch = Branch.objects.get(id=branch_id, tenant=user.tenants)
                    filters &= Q(branch=branch)
                except Branch.DoesNotExist:
                    pass
        return filters

    @action(detail=False, methods=['get'], url_path='stats')
    def get_dashboard_stats(self, request):
        """
        Get dashboard statistics based on time period and branch filter
        """
        # Get parameters from request
        period = request.query_params.get('period', 'today')
        branch_id = request.query_params.get('branch_id')
        
        # Get base filters
        filters = self._get_base_filters(request.user, branch_id)
        
        # Get data based on period
        if period == 'today':
            data = self._get_today_stats(filters)
        elif period == 'month':
            data = self._get_month_stats(filters)
        elif period == 'year':
            data = self._get_year_stats(filters)
        else:
            # Custom date range
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            if not start_date or not end_date:
                return Response(
                    {"error": "Both start_date and end_date are required for custom range"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            data = self._get_custom_range_stats(filters, start_date, end_date)
        
        # Calculate revenue change percentage
        if period != 'custom':
            data['revenue_change'] = self._calculate_revenue_change(filters, period)
        
        serializer = DashboardSerializer(data)
        return Response(serializer.data)

    def _get_today_stats(self, filters):
        """Get statistics for today"""
        today = timezone.now().date()
        today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        
        # Orders
        orders = Order.objects.filter(filters & Q(created_at__gte=today_start))
        total_orders = orders.count()
        
        # Revenue
        revenue = Payment.objects.filter(
            order__in=orders
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        # Active tables
        active_tables = Table.objects.filter(
            branch__tenant=self.request.user.tenants,
            table_order__status__in=['pending_payment', 'placed', 'progress']
        ).distinct().count()
        
        # Rating
        rating = Feedback.objects.filter(
            order__in=orders
        ).aggregate(avg_rating=Avg('service_rating'))['avg_rating'] or 0
        
        # Hourly revenue for chart
        hourly_data = self._get_hourly_revenue(filters, today_start)
        
        return {
            'period': 'today',
            'revenue': revenue,
            'orders': total_orders,
            'active_tables': active_tables,
            'rating': round(rating, 1),
            'chart_data': hourly_data,
        }

    def _get_month_stats(self, filters):
        """Get statistics for current month"""
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Orders
        orders = Order.objects.filter(filters & Q(created_at__date__gte=month_start))
        total_orders = orders.count()
        
        # Revenue
        revenue = Payment.objects.filter(
            order__in=orders
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        # Active tables
        active_tables = Table.objects.filter(
            branch__tenant=self.request.user.tenants,
            table_order__status__in=['pending_payment', 'placed', 'progress']
        ).distinct().count()
        
        # Rating
        rating = Feedback.objects.filter(
            order__in=orders
        ).aggregate(avg_rating=Avg('service_rating'))['avg_rating'] or 0
        
        # Weekly revenue for chart
        weekly_data = self._get_weekly_revenue(filters, month_start)
        
        return {
            'period': 'month',
            'revenue': revenue,
            'orders': total_orders,
            'active_tables': active_tables,
            'rating': round(rating, 1),
            'chart_data': weekly_data,
        }

    def _get_year_stats(self, filters):
        """Get statistics for current year"""
        today = timezone.now().date()
        year_start = today.replace(month=1, day=1)
        
        # Orders
        orders = Order.objects.filter(filters & Q(created_at__date__gte=year_start))
        total_orders = orders.count()
        
        # Revenue
        revenue = Payment.objects.filter(
            order__in=orders
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        # Active tables
        active_tables = Table.objects.filter(
            branch__tenant=self.request.user.tenants,
            table_order__status__in=['pending_payment', 'placed', 'progress']
        ).distinct().count()
        
        # Rating
        rating = Feedback.objects.filter(
            order__in=orders
        ).aggregate(avg_rating=Avg('service_rating'))['avg_rating'] or 0
        
        # Monthly revenue for chart
        monthly_data = self._get_monthly_revenue(filters, year_start)
        
        return {
            'period': 'year',
            'revenue': revenue,
            'orders': total_orders,
            'active_tables': active_tables,
            'rating': round(rating, 1),
            'chart_data': monthly_data,
        }

    def _get_custom_range_stats(self, filters, start_date, end_date):
        """Get statistics for custom date range"""
        try:
            start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Orders
        orders = Order.objects.filter(
            filters & Q(created_at__date__range=[start_date, end_date])
        )
        total_orders = orders.count()
        
        # Revenue
        revenue = Payment.objects.filter(
            order__in=orders
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        # Active tables
        active_tables = Table.objects.filter(
            branch__tenant=self.request.user.tenants,
            table_order__status__in=['pending_payment', 'placed', 'progress']
        ).distinct().count()
        
        # Rating
        rating = Feedback.objects.filter(
            order__in=orders
        ).aggregate(avg_rating=Avg('service_rating'))['avg_rating'] or 0
        
        # Daily revenue for chart
        daily_data = self._get_daily_revenue(filters, start_date, end_date)
        
        return {
            'period': 'custom',
            'revenue': revenue,
            'orders': total_orders,
            'active_tables': active_tables,
            'rating': round(rating, 1),
            'chart_data': daily_data,
            'start_date': start_date,
            'end_date': end_date
        }

    def _calculate_revenue_change(self, filters, period):
        """Calculate revenue change percentage compared to previous period"""
        today = timezone.now().date()
        
        if period == 'today':
            # Compare with yesterday
            current_start = today
            previous_start = today - timedelta(days=1)
            current_revenue = self._get_revenue_for_date(filters, current_start)
            previous_revenue = self._get_revenue_for_date(filters, previous_start)
        elif period == 'month':
            # Compare with previous month
            current_start = today.replace(day=1)
            previous_start = (current_start - timedelta(days=1)).replace(day=1)
            current_revenue = self._get_revenue_for_date_range(filters, current_start, today)
            previous_revenue = self._get_revenue_for_date_range(filters, previous_start, current_start - timedelta(days=1))
        elif period == 'year':
            # Compare with previous year
            current_start = today.replace(month=1, day=1)
            previous_start = current_start.replace(year=current_start.year-1)
            current_revenue = self._get_revenue_for_date_range(filters, current_start, today)
            previous_revenue = self._get_revenue_for_date_range(filters, previous_start, previous_start.replace(month=12, day=31))
        
        if previous_revenue == 0:
            return 0
        return round(((current_revenue - previous_revenue) / previous_revenue) * 100, 1)

    def _get_revenue_for_date(self, filters, date):
        """Get revenue for a specific date"""
        return Payment.objects.filter(
            order__in=Order.objects.filter(
                filters & Q(created_at__date=date)
            )
        ).aggregate(total=Sum('amount_paid'))['total'] or 0

    def _get_revenue_for_date_range(self, filters, start_date, end_date):
        """Get revenue for a date range"""
        return Payment.objects.filter(
            order__in=Order.objects.filter(
                filters & Q(created_at__date__range=[start_date, end_date])
            )
        ).aggregate(total=Sum('amount_paid'))['total'] or 0

    def _get_hourly_revenue(self, filters, start_time):
        """Get hourly revenue data for chart"""
        end_time = start_time + timedelta(days=1)
        
        hourly_data = Payment.objects.filter(
            order__in=Order.objects.filter(
                filters & Q(created_at__range=[start_time, end_time])
            )
        ).annotate(
            hour=ExtractHour('created_at')
        ).values('hour').annotate(
            total=Sum('amount_paid')
        ).order_by('hour')
        
        # Fill in missing hours with 0
        full_data = []
        for hour in range(24):
            hour_data = next((h for h in hourly_data if h['hour'] == hour), {'total': 0})
            full_data.append({
                'hour': hour,
                'total': float(hour_data['total'] or 0)
            })
        
        # Format for chart
        labels = [f"{h['hour']}:00" for h in full_data]
        data = [h['total'] for h in full_data]
        
        return {
            'labels': labels,
            'data': data
        }

    def _get_weekly_revenue(self, filters, start_date):
        """Get weekly revenue data for chart"""
        weekly_data = Payment.objects.filter(
            order__in=Order.objects.filter(
                filters & Q(created_at__date__gte=start_date)
            )
        ).annotate(
            week=ExtractWeek('created_at')
        ).values('week').annotate(
            total=Sum('amount_paid')
        ).order_by('week')
        
        # Format for chart
        labels = [f"Week {w['week']}" for w in weekly_data]
        data = [float(w['total'] or 0) for w in weekly_data]
        
        return {
            'labels': labels,
            'data': data
        }

    def _get_monthly_revenue(self, filters, start_date):
        """Get monthly revenue data for chart"""
        monthly_data = Payment.objects.filter(
            order__in=Order.objects.filter(
                filters & Q(created_at__date__gte=start_date)
            )
        ).annotate(
            month=ExtractMonth('created_at')
        ).values('month').annotate(
            total=Sum('amount_paid')
        ).order_by('month')
        
        # Format for chart
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        labels = [month_names[m['month']-1] for m in monthly_data]
        data = [float(m['total'] or 0) for m in monthly_data]
        
        return {
            'labels': labels,
            'data': data
        }

    def _get_daily_revenue(self, filters, start_date, end_date):
        """Get daily revenue data for chart"""
        daily_data = Payment.objects.filter(
            order__in=Order.objects.filter(
                filters & Q(created_at__date__range=[start_date, end_date])
            )
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total=Sum('amount_paid')
        ).order_by('date')
        
        # Format for chart
        labels = [d['date'].strftime('%b %d') for d in daily_data]
        data = [float(d['total'] or 0) for d in daily_data]
        
        return {
            'labels': labels,
            'data': data
        }

    @action(detail=False, methods=['get'], url_path='top-items')
    def get_top_menu_items(self, request):
        """Get top menu items ordered"""
        branch_id = request.query_params.get('branch_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Get base filters
        filters = self._get_base_filters(request.user, branch_id)
        
        # Date filters
        date_filter = Q()
        if start_date and end_date:
            try:
                start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
                date_filter &= Q(order_items__order__created_at__date__range=[start_date, end_date])
            except ValueError:
                pass
        
        # Get top items
        top_items = Menu.objects.filter(
            order_items__order__in=Order.objects.filter(filters)
        ).filter(date_filter).annotate(
            order_count=Count('order_items')
        ).order_by('-order_count')[:6]
        
        # Format response
        data = [{
            'name': item.name,
            'count': item.order_count,
            'image': request.build_absolute_uri(item.image.url) if item.image else None
        } for item in top_items]
        
        return Response(data)