from django.contrib import admin
from .models import Branch
from leaflet.admin import LeafletGeoAdmin

@admin.register(Branch)
class BranchAdmin(LeafletGeoAdmin):
    pass
