from django.contrib import admin
from .models import MenuAvailability

@admin.register(MenuAvailability)
class MenuAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('menu_item_id', 'branch_id', 'is_available', 'special_notes', 'updated_at')
    search_fields = ('menu_item_id', 'branch_id')
    list_filter = ('is_available',)
