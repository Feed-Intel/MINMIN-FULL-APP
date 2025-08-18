from django.urls import re_path
from .consumers import RestaurantConsumer, UserConsumer

websocket_urlpatterns = [
    re_path(r'ws/restaurant/(?P<tenant_id>[0-9a-f-]{36})/$', RestaurantConsumer.as_asgi()),
    re_path( r'ws/user/(?P<user_id>[0-9a-f-]{36})/', UserConsumer.as_asgi() ),
]