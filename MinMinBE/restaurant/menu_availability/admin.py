from django.contrib import admin
from .models import MenuAvailability

@admin.register(MenuAvailability)
class MenuAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('menu_item', 'branch', 'is_available', 'updated_at')
    search_fields = ['menu_item__name', 'branch__tenant__restaurant_name', 'special_notes']
