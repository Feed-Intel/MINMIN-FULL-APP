import json
from datetime import datetime

class LogEventsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if the request method is POST, PUT, DELETE, or PATCH
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            self.log_event(request)
        
        response = self.get_response(request)
        return response

    def log_event(self, request):
        if request.path.__contains__("account"):
            return
        event_data = {
            "method": request.method,
            "path": request.path,
            "body": self.safe_body(request),
            "user": request.user.email if request.user.is_authenticated else "Anonymous",
            "timestamp": datetime.now().isoformat(),
        }
        # Log to a file (or save to a database if preferred)
        # with open("events_log.json", "a") as log_file:
        #     log_file.write(json.dumps(event_data) + "\n")

    def safe_body(self, request):
        try:
            return json.loads(request.body.decode("utf-8"))
        except Exception:
            return "Non-JSON or Empty Body"
