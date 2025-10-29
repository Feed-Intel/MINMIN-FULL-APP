from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
import requests as MakeRequests
from rest_framework.throttling import UserRateThrottle
from django.shortcuts import get_object_or_404
from django.utils.timezone import now, timedelta
from django.core.mail import send_mail
import logging
from hashlib import sha256
from rest_framework.decorators import action
from django.core.cache import cache
from accounts.models import User
from minminbe.settings import EMAIL_HOST_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.pagination import PageNumberPagination
from .serializers import UserSerializer, CustomTokenObtainPairSerializer,CustomRefreshToken
from .permissions import IsCustomer, IsRestaurant, IsAdmin,IsAdminOrRestaurant ,HasCustomAPIKey
from django.conf import settings
from django.contrib.auth import login
from allauth.socialaccount.models import SocialAccount
from allauth.socialaccount.models import SocialLogin
from allauth.socialaccount.providers.google.provider import GoogleProvider
from allauth.socialaccount.providers.facebook.provider import FacebookProvider
from google.oauth2 import id_token
from google.auth.transport import requests
import random


# Utility function for token generation
def generate_tokens(user):
    refresh = CustomRefreshToken.for_user(user)
    return {
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
    }


class RegisterView(APIView):
    """
    Handles user registration and sends an OTP for email verification.
    """
    permission_classes = [HasCustomAPIKey]

    def post(self, request):
        serializer = UserSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = (serializer.validated_data.get('email') or "").lower().strip()

        # Check if a user with the same email already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the user first (without OTP), then try to email OTP.
        # If email sending fails, roll back user creation so the UI gets a clear error
        # and we don't leave a half-registered account.
        user = serializer.save()

        # Generate OTP (do not persist until email succeeds)
        otp = str(random.randint(100000, 999999))
        if user.user_type == 'customer':
            try:
                send_mail(
                    subject="Your OTP for Registration",
                    message=f"Your OTP is {otp}. It is valid for 10 minutes.",
                    from_email=EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception as e:
                # Roll back created user if we cannot deliver the OTP
                try:
                    user.delete()
                except Exception:
                    pass
                logging.getLogger(__name__).warning(
                    f"Failed to send registration OTP email to {email}: {e}"
                )
                return Response(
                    {"error": "Could not send OTP email. Please try again later."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            # Email sent OK — persist hashed OTP and expiry
            user.otp = sha256(otp.encode()).hexdigest()
            user.otp_expiry = now() + timedelta(minutes=10)
            user.save(update_fields=["otp", "otp_expiry"])

        return Response(
            {"message": "Registration successful. Please verify your OTP."},
            status=status.HTTP_201_CREATED,
        )


class VerifyOTPView(APIView):
    """
    Verifies the OTP sent during registration and activates the user account.
    """
    permission_classes = [HasCustomAPIKey]
    def post(self, request):
        email = request.data.get("email").lower()
        otp = request.data.get("otp")

        user = get_object_or_404(User, email=email)

        if user.otp != sha256(otp.encode()).hexdigest():
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if now() > user.otp_expiry:
            return Response({"error": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)

        user.otp = None
        user.otp_expiry = None
        user.is_active = True
        user.save()

        tokens = generate_tokens(user)
        return Response(
            tokens,
            status=status.HTTP_200_OK
        )


class LoginView(TokenObtainPairView):
    """
    Handles user login and prevents login after multiple failed attempts.
    """
    permission_classes = [HasCustomAPIKey]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Extract email and password from the request
        email = request.data.get("email", "").lower().strip()
        password = request.data.get("password", "").strip()

        if not email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check if the account is locked
        if user.locked_until and user.locked_until > now():
            remaining_time = (user.locked_until - now()).seconds // 60
            return Response(
                {"error": f"Account is locked. Try again in {remaining_time} minutes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Handle OTP cases
        if user.otp:
            # Check if the user remembers their password and logs in
            if user.check_password(password):
                # Clear OTP if the user successfully logs in without resetting the password
                user.otp = None
                user.failed_attempts = 0
                user.locked_until = None
                user.save()
            else:
                return Response(
                    {"error": "Account is not verified. Please verify your email or reset your password."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        if user.user_type == 'restaurant' and user.tenants is None:
            return Response(
                {"error": "Your Restaurant is not Registered. Please contact your administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.user_type == 'branch' and user.branch is None:
            return Response(
                {"error": "Your Branch is not set. Please contact your administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Authenticate the user
        if not user.check_password(password):
            user.failed_attempts += 1

            # Lock the account if failed attempts exceed the limit
            max_attempts = getattr(settings, "MAX_FAILED_ATTEMPTS", 5)
            lockout_duration = getattr(settings, "LOCKOUT_DURATION", 15)  # In minutes

            if user.failed_attempts >= max_attempts:
                user.locked_until = now() + timedelta(minutes=lockout_duration)
                user.failed_attempts = 0  # Reset failed attempts after locking
                user.save()

                return Response(
                    {"error": f"Account locked due to too many failed login attempts. Please try again after {lockout_duration} minutes."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            user.save()
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Reset failed attempts and lockout status after successful login
        user.failed_attempts = 0
        user.locked_until = None
        user.save()

        # Generate JWT tokens
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = serializer.validated_data
        response_data = {
            "access_token": tokens.get("access"),
            "refresh_token": tokens.get("refresh")
        }

        return Response(response_data, status=status.HTTP_200_OK)


from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from core.redis_client import redis_client
from django.shortcuts import get_object_or_404
from .serializers import UserSerializer
from .models import User
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

# Custom Permissions
class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == 'customer'


class IsRestaurant(BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == 'restaurant'


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_staff



# Pagination Class
class UserPagination(PageNumberPagination):
    page_size = 10


# Base Role-Based View
class RoleBasedView(ModelViewSet):
    """
    Base view for role-based access control.
    """
    permission_classes = [HasCustomAPIKey]
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['email', 'full_name', 'phone', 'user_type']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    pagination_class = UserPagination

    def get_permissions(self):
        if not hasattr(self, 'role_permissions'):
            raise NotImplementedError("Subclasses must define `role_permissions`.")
        return [permission() for permission in self.role_permissions]


# Views for specific roles

class CustomerOnlyView(RoleBasedView):
    """
    View accessible only to customers.
    """
    role_permissions = [IsCustomer]

    def get(self, request):
        return Response({'message': 'Hello, Customer!'})


class RestaurantOnlyView(RoleBasedView):
    """
    View accessible only to restaurants.
    """
    role_permissions = [IsRestaurant]

    def get(self, request):
        return Response({'message': 'Hello, Restaurant!'})

class AdminOrRestaurantOnlyView(RoleBasedView):
    """
    View accessible only to administrators or restaurants.
    """
    role_permissions = [IsAdminOrRestaurant]
    queryset = User.objects.select_related('branch').all()

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'restaurant' or user.user_type == 'admin':
            return self.queryset.filter(branch__tenant__admin=user,user_type='branch')
        else:
            return self.queryset.none()

class AdminOnlyView(RoleBasedView):
    """
    View accessible only to administrators to fetch all user data.
    """
    role_permissions = [IsAdmin]
    queryset = User.objects.all()

    def get_queryset(self):
        cached_users = User.objects.all()
        return cached_users


# View to update user profile
class AllUsersView(ModelViewSet):
    """
    Allows authenticated users to update or delete their profile.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, HasCustomAPIKey]

    def update(self, request, *args, **kwargs):
        user = self.get_object()  # Retrieves the user based on the `pk` in URL
        latitude = request.data.get('lat')
        longitude = request.data.get('lng')
        if not self._is_authorized_user(request, user):
            return Response(
                {'error': 'You are not allowed to modify other users'},
                status=status.HTTP_403_FORBIDDEN
            )
        user_id = user.id
        redis_key = str(user_id)

        # store location for 24 hours
        redis_client.set(redis_key, f"{latitude},{longitude}", ex=86400)
        serializer = self.get_serializer(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()  # Retrieves the user based on the `pk` in URL

        if not self._is_authorized_user(request, user):
            return Response(
                {'error': 'You are not allowed to delete other users'},
                status=status.HTTP_403_FORBIDDEN
            )

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _is_authorized_user(self, request, user):
        """
        Checks if the user making the request is authorized to modify or delete the given user.
        """
        try:
            # Check if the requesting user is the same as the target user
            if request.user.id == user.id:
                return True
            
            # Check if the requesting user is the admin of the user's branch tenant
            if user.branch and user.branch.tenant and user.branch.tenant.admin.id == request.user.id:
                return True

            # Check if the requesting user is a system admin
            if request.user.user_type == 'admin':
                return True

        except AttributeError:
            # Handle cases where user.branch or user.branch.tenant might be None
            pass

        return False



class GoogleLoginView(APIView):
    """
    Implements Google login without using SocialLoginView.
    Verifies Google ID token and issues JWT tokens.
    """
    permission_classes = [HasCustomAPIKey]
    def post(self, request, *args, **kwargs):
        # Retrieve the ID token from the request
        code = request.data.get("code")
        redirect_uri = request.data.get("redirect_uri")
        code_verifier = request.data.get("code_verifier")
        token = request.data.get("id_token")
        if not code and not token:
            return Response(
                {"error": "Missing authorization code"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if code:
            token_response = MakeRequests.post(
                "https://oauth2.googleapis.com/token",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                    "code_verifier": code_verifier,
                    "code": code,
                },
            )
            data = token_response.json()
            token = data.get("id_token")
        if not token:
            return Response({"detail": "ID token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the Google ID token
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                GOOGLE_CLIENT_ID
            )

            # Extract user information
            email = idinfo.get("email")
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")
            uid = idinfo["sub"]

            if not email:
                return Response({"detail": "Invalid Google ID token: Email not found."}, status=status.HTTP_400_BAD_REQUEST)

            # Check if the social account or user already exists
            try:
                social_account = SocialAccount.objects.get(uid=uid, provider=GoogleProvider.id)
                user = social_account.user
            except SocialAccount.DoesNotExist:
                # Check if a user with the email already exists
                user, created = User.objects.get_or_create(email=email, defaults={
                    "full_name": f"{first_name} {last_name}",
                    "user_type": "customer",
                    "is_active": True,
                })

                # Create the SocialAccount for the user
                social_account = SocialAccount(user=user, uid=uid, provider=GoogleProvider.id)
                social_account.extra_data = idinfo
                social_account.save()

            # Create a SocialLogin instance
            social_login = SocialLogin(user=user, account=social_account)

            user.backend = 'allauth.account.auth_backends.AuthenticationBackend'

            # Perform the login
            login(request, user)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            tokens = {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
            }
            return Response(tokens, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({"detail": f"Invalid Google ID token: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class FacebookLoginView(APIView):
    """
    Implements Facebook login without using SocialLoginView.
    Verifies Facebook access token and issues JWT tokens.
    """
    permission_classes = [HasCustomAPIKey]

    def post(self, request, *args, **kwargs):
        # Retrieve the Facebook access token from the request
        access_token = request.data.get("access_token")
        if not access_token:
            return Response({"detail": "Access token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the Facebook access token and retrieve user data
            url = f"https://graph.facebook.com/me?fields=id,name,email&access_token={access_token}"
            response = MakeRequests.get(url)
            if response.status_code != 200:
                return Response({"detail": "Invalid Facebook access token."}, status=status.HTTP_400_BAD_REQUEST)

            fb_data = response.json()
            email = fb_data.get("email")
            name = fb_data.get("name", "Anonymous")
            fb_uid = fb_data.get("id")

            if not email:
                return Response({"detail": "Invalid Facebook data: Email not found."}, status=status.HTTP_400_BAD_REQUEST)

            # Check if the user or social account already exists
            try:
                social_account = SocialAccount.objects.get(uid=fb_uid, provider=FacebookProvider.id)
                user = social_account.user
            except SocialAccount.DoesNotExist:
                # Create a new user or fetch existing user by email
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={"full_name": name, "user_type": "customer","is_active": True}
                )

                # Create a new SocialAccount linked to the user
                social_account = SocialAccount(user=user, uid=fb_uid, provider=FacebookProvider.id)
                social_account.extra_data = fb_data
                social_account.save()
            
            user.backend = 'allauth.account.auth_backends.AuthenticationBackend'

            # Perform the login
            login(request, user)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            tokens = {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
            }
            return Response(tokens, status=status.HTTP_200_OK)

        except MakeRequests.exceptions.RequestException as e:
            # Handle connection errors with Facebook API
            return Response({"detail": f"Error connecting to Facebook API: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            # Catch all other errors
            return Response({"detail": f"Error during Facebook login: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
    
class PasswordResetThrottle(UserRateThrottle):
    rate = '1/15min'

class RequestPasswordResetView(APIView):
    """
    View to request a password reset with an OTP sent to the user's email.
    """
    permission_classes = [HasCustomAPIKey]
    # throttle_classes = [PasswordResetThrottle] # to set limit to request sent to this end point
    def post(self, request):
        email = (request.data.get('email') or "").lower().strip()
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
        
        if user.otp and user.otp_expiry > now():
            return Response({"error": "An OTP has already been sent. Please wait until it expires."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate OTP (do not persist until email is successfully sent)
        otp = str(random.randint(100000, 999999))

        # Attempt to send email first
        try:
            send_mail(
                subject="Your Password Reset OTP",
                message=f"Your OTP is {otp}. It is valid for 10 minutes.",
                from_email=EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Do not persist OTP if email fails; return clear, non-500 error
            return Response(
                {"error": "Could not send OTP email. Please try again later."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Email sent OK — persist hashed OTP and expiry
        user.otp = sha256(otp.encode()).hexdigest()
        user.otp_expiry = now() + timedelta(minutes=10)
        user.save(update_fields=["otp", "otp_expiry"])

        return Response({"message": "Password reset OTP sent to your email."}, status=status.HTTP_200_OK)

class CheckOTPView(APIView):
    """
    View to check if the OTP is valid.
    """
    permission_classes = [HasCustomAPIKey]
    def post(self, request):
        email = request.data.get('email').lower()
        otp = request.data.get('otp')   
        if not all([email, otp]):
            return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
        if user.otp != sha256(otp.encode()).hexdigest():
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "OTP is valid."}, status=status.HTTP_200_OK)

class ResetPasswordWithOTPView(APIView):
    """
    View to reset the password using the OTP.
    """
    permission_classes = [HasCustomAPIKey]
    def post(self, request):
        email = request.data.get('email').lower()
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not all([email, otp, new_password]):
            return Response({"error": "Email, OTP, and new password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)

        if user.otp != sha256(otp.encode()).hexdigest():
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if now() > user.otp_expiry:
            return Response({"error": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Reset the password
        user.set_password(new_password)
        user.otp = None
        user.otp_expiry = None
        user.save()
        tokens = generate_tokens(user)
        return Response(
            tokens,
            status=status.HTTP_200_OK
        )
    

class LogoutView(APIView):
    """
    Handles user logout by blacklisting the refresh token.
    """
    permission_classes = [IsAuthenticated,HasCustomAPIKey]

    def post(self, request):
        # Extract the refresh token from the request data
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token or logout failed."}, status=status.HTTP_400_BAD_REQUEST)
