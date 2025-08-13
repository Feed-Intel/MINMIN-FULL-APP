import json
from itertools import islice

import requests

url = "https://exp.host/--/api/v2/push/send"

headers = {
    "Accept": "application/json",
    "Accept-encoding": "gzip, deflate",
    "Content-Type": "application/json",
}


def _chunks(iterable, size=100):
    """Yield successive chunks from *iterable* of length *size*."""
    it = iter(iterable)
    while True:
        chunk = list(islice(it, size))
        if not chunk:
            break
        yield chunk


def send_push_notification(push_tokens, title, body):
    """Send push notifications to Expo in batches with basic error handling."""
    for chunk in _chunks(push_tokens):
        messages = [
            {
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": {"someData": "goes here"},
            }
            for token in chunk
        ]
        try:
            response = requests.post(
                url, headers=headers, data=json.dumps(messages), timeout=5
            )
            response.raise_for_status()
            print("Notification batch sent successfully!")
            print(response.json())
        except requests.RequestException as exc:
            print(f"Failed to send notification batch: {exc}")
