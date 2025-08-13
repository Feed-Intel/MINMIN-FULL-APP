import os
import redis
from django.conf import settings

redis_url = getattr(settings, 'REDIS_URL', os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/0'))
redis_client = redis.StrictRedis.from_url(redis_url, decode_responses=True)
