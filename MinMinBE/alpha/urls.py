"""
URL configuration for alpha project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from alpha import settings
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.views.generic import TemplateView

schema_view = get_schema_view(
    openapi.Info(
        title="Alpha API Docs",
        default_version='v1',
        description="API documentation",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
    path('api/auth/', include('accounts.urls')),
    path('api/v1/', include('restaurant.menu.urls')),
    path('api/v1/', include('restaurant.branch.urls')),
    path('api/v1/', include('restaurant.tenant.urls')),
    path('api/v1/', include('restaurant.table.urls')),
    path('api/v1/', include('restaurant.combo.urls')),
    path('api/v1/', include('restaurant.related_menu.urls')),
    path('api/v1/', include('restaurant.menu_availability.urls')),
    path('api/v1/', include('restaurant.qr_code.urls')),
    path('api/v1/', include('customer.order.urls')),
    path('api/v1/', include('customer.feedback.urls')),
    path('api/v1/', include('customer.cart.urls')),
    path('api/v1/', include('restaurant.discount.urls')),
    path('api/v1/', include('customer.address.urls')),
    path('api/v1/', include('customer.payment.urls')),
    path('api/v1/', include('customer.feedback.urls')),
    path('api/v1/', include('customer.notification.urls')),
    path('api/v1/', include('restaurant.discount.urls')),
    path('api/v1/', include('loyalty.urls')),
    path('api/v1/', include('feed.urls')),
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('terms/', TemplateView.as_view(template_name="terms_and_condition.html"), name='terms'),
    path('privacy/', TemplateView.as_view(template_name="privacy_policy.html"), name='privacy'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
