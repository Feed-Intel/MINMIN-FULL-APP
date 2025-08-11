from django.contrib import admin
from .models import GlobalLoyaltySettings,RestaurantLoyaltySettings

admin.site.register(GlobalLoyaltySettings)
admin.site.register(RestaurantLoyaltySettings)
