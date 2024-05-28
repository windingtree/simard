"""
Simple wrapper around redis for the project needs
"""
import redis
import re
import json
import atexit
from simard.settings import REDIS_URL
from model.exception import SimardException


class CacheException(SimardException):
    pass


class Cache(object):
    # Define a time to catch the objects
    _DEFAULT_RETENTION_TIME = 60  # 60 seconds
    _REDIS_URL = REDIS_URL

    def __init__(self):
        """
        Constructor for the cache object
        """
        self._redis = None
        atexit.register(self.cleanup)

    def _get_redis(self):
        """
        Wrapper to lazy load the redis client
        """
        if self._redis is None:

            # Chech the REDIS_URL was provided
            if self._REDIS_URL is None:
                raise CacheException('Server Error: Contact Support', 500)

            # Parse the connection string
            m = re.match(
                r'^redis(?P<ssl_flag>s)?://((?P<user_id>.+):(?P<user_password>.+)@)?(?P<host>.+):(?P<port>[0-9]+)(/\?password=(?P<password>.+))?$',
                self._REDIS_URL
            )

            # Verify the parsing is successfull
            if(not m):
                raise CacheException('Server Error: Contact Support', 500)

            ssl_enabled = m.group('ssl_flag') is not None

            # Initialize the Redis Client with password if provided
            if m.group('password'):
                self._redis = redis.Redis(
                    host=m.group('host'),
                    port=m.group('port'),
                    password=m.group('password'),
                    ssl=ssl_enabled
                )

            # Otherwise without password
            else:
                self._redis = redis.Redis(
                    host=m.group('host'),
                    port=m.group('port'),
                    ssl=ssl_enabled
                )

            # for Redis versions that supports ACL. eg. v6
            if m.group('user_id'):
                self._redis.execute_command(f"AUTH {m.group('user_id')} {m.group('user_password')}")

        return self._redis

    def cleanup(self):
        """
        Cleanup the cache, close connections
        """
        if self._redis is not None:
            self._redis.close()
            self._redis = None

    def store(self, key, object, expiry=None):
        """
        Store a value
        """
        # Serialize the object as JSON
        serialized = json.dumps(object)

        # Define the retention time
        if expiry is None:
            expiry = self._DEFAULT_RETENTION_TIME

        # Store the value
        try:
            return self._get_redis().set(key, serialized, ex=expiry)
        except redis.ConnectionError:
            return None

    def retrieve(self, key):
        """
        Retrieve a value from the cache
        """
        # Retrieve the serialized object
        try:
            serialized = self._get_redis().get(key)
        except redis.ConnectionError:
            serialized = None

        # If not Found, return None
        if not serialized:
            return None

        # Otherwise return the unserialized object
        return json.loads(serialized)


cache = Cache()
