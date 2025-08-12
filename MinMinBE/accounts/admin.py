from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.utils.timezone import now, timedelta
from hashlib import sha256
from leaflet.admin import LeafletGeoAdmin
from django.conf import settings
from .models import User
import random

class CustomUserAdmin(BaseUserAdmin,LeafletGeoAdmin):
    # Fields displayed in the admin user list view
    list_display = ('id','email', 'full_name', 'user_type', 'is_staff', 'is_active', 'created_at')
    
    # Filters for the admin user list view
    list_filter = ('user_type', 'is_staff', 'is_active')
    
    # Fields searchable in the admin search bar
    search_fields = ('email', 'full_name', 'phone')
    
    # Default sorting in the admin panel
    ordering = ('email',)
    
    # Fields set as read-only in the admin panel
    readonly_fields = ('created_at', 'updated_at')

    # Groups fields for the user detail view in the admin panel
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone')}),
        ('Permissions', {'fields': ('user_type', 'branch','is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )

    # Groups fields for the user creation form in the admin panel
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'full_name', 'phone', 'branch','user_type', 'is_staff', 'is_active'),
        }),
    )

    # Specifies the model this admin is for
    model = User

    def save_model(self, request, obj, form, change):
        """
        Override save_model to send an email when a new user is created by an admin.
        """
        is_new_user = obj.pk is None  # Check if the user is being created
        otp = str(random.randint(100000, 999999))
        obj.otp = sha256(otp.encode()).hexdigest()
        obj.otp_expiry = now() + timedelta(minutes=10)
        super().save_model(request, obj, form, change)

        # Send email only if it's a new user
        if is_new_user:
            self.send_otp_email(obj, otp)

    def send_otp_email(self, user, otp):
        """
        Sends a welcome email to the newly created user.
        """
        subject = "Welcome to Our Platform"
        message = render_to_string('emails/welcome_email.html', {'user': user, 'otp': otp})
        recipient_list = [user.email]
        send_mail(
            subject=subject,
            message='',  # Leave plain text message blank if using HTML email
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=recipient_list,
            fail_silently=False,
            html_message=message  # Pass the HTML message here
        )

# Registers the custom user admin with the admin site
admin.site.register(User, CustomUserAdmin)
