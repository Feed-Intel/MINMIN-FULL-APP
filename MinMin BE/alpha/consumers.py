import json
from channels.generic.websocket import AsyncWebsocketConsumer

class RestaurantConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tenant_id = self.scope['url_route']['kwargs']['tenant_id']
        self.group_name = f'{self.tenant_id}'

        # Join the "menus" group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the "menus" group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def send_restaurant_notification(self, event):
        # Send the order details to the WebSocket
        await self.send(text_data=json.dumps(event["message"]))

class UserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.group_name = f'{self.user_id}'

        # Join the "menus" group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the "menus" group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def send_user_notification(self, event):
        # Send the order details to the WebSocket
        await self.send(text_data=json.dumps(event["message"]))