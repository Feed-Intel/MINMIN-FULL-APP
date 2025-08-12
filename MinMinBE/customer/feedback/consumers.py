from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import Feedback
from asgiref.sync import sync_to_async

class FeedbackConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.feedback_id = self.scope['url_route']['kwargs']['feedback_id']
        self.feedback_group_name = f'feedback_{self.feedback_id}'

        # Add this WebSocket connection to the group
        await self.channel_layer.group_add(
            self.feedback_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Remove this WebSocket connection from the group
        await self.channel_layer.group_discard(
            self.feedback_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        rating = data.get('rating')
        message = data.get('message')

        # Update the feedback in the database
        await self.update_feedback(self.feedback_id, rating, message)

        # Notify the group about the updated feedback
        await self.channel_layer.group_send(
            self.feedback_group_name,
            {
                'type': 'feedback_update',
                'rating': rating,
                'message': message,
            }
        )

    async def feedback_update(self, event):
        rating = event['rating']
        message = event['message']

        # Send the updated feedback to the WebSocket
        await self.send(text_data=json.dumps({
            'rating': rating,
            'message': message,
        }))

    @sync_to_async
    def update_feedback(self, feedback_id, rating, message):
        try:
            feedback = Feedback.objects.get(id=feedback_id)
            if rating is not None:
                feedback.rating = rating
            if message is not None:
                feedback.message = message
            feedback.save()
        except Feedback.DoesNotExist:
            pass
