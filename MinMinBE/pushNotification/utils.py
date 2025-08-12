import requests
import json

url = "https://exp.host/--/api/v2/push/send"

headers = {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json"
    }

def send_push_notification(pushTokens,title,body):
    for token in pushTokens:
        message = {
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
            "data": {"someData": "goes here"}
        }

        response = requests.post(url, headers=headers, data=json.dumps(message))

        if response.status_code == 200:
            print("Notification sent successfully!")
            print(response.json())
        else:
            print("Failed to send notification")
            print(response.status_code)
            print(response.text)