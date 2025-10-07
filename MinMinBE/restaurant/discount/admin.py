from django.contrib import admin
from .models import Discount,Coupon,DiscountRule

admin.site.register([Discount,Coupon,DiscountRule])
