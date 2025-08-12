from django.contrib import admin
from .models import Tenant # Make sure to import your Tenant model

# Register your model with a ModelAdmin
@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('id','restaurant_name') 
    search_fields = ('id', 'restaurant_name')