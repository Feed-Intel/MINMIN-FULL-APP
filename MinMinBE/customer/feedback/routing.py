from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/feedback/<uuid:feedback_id>/', consumers.FeedbackConsumer.as_asgi()),  # WebSocket for specific feedback
]
