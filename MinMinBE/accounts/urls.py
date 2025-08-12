from django.urls import path, include
from .views import RegisterView, LoginView, AllUsersView, AdminOrRestaurantOnlyView,AdminOnlyView, GoogleLoginView,FacebookLoginView, VerifyOTPView, RequestPasswordResetView, ResetPasswordWithOTPView, CheckOTPView,LogoutView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/<uuid:pk>/', AllUsersView.as_view({'get':'retrieve','put': 'update', 'delete': 'destroy'}), name='all-users'),
    path('users/', AdminOnlyView.as_view({'get': 'list'}), name='admin-users'),
    path('branchAdmins/', AdminOrRestaurantOnlyView.as_view({'get':'list'}), name='branch-admins'),
    path('social/google/', GoogleLoginView.as_view()),
    path('social/facebook/', FacebookLoginView.as_view()),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('check-otp/', CheckOTPView.as_view(), name='check-otp'),
    path('password-reset/request/', RequestPasswordResetView.as_view(), name='password-reset-request'),
    path('password-reset/verify/', ResetPasswordWithOTPView.as_view(), name='password-reset-verify'),
    path('social/', include('allauth.urls')),
]
