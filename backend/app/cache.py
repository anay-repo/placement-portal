import redis
import json
from config import Config

# CONNECT TO REDIS
redis_client = redis.from_url(Config.REDIS_URL)


def get_cached(key):
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data) 
        return None
    except Exception:
        return None


def set_cached(key, value, expire_seconds=300):
    try:
        redis_client.setex(
            key,
            expire_seconds,
            json.dumps(value) 
        )
    except Exception:
        pass  


def delete_cached(key):
    try:
        redis_client.delete(key)
    except Exception:
        pass


def clear_pattern(pattern):
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except Exception:
        pass