import unittest
from unittest import mock
import json
from redis import Redis
import simard.settings
from simard.cache import Cache, CacheException


class TestCache(unittest.TestCase):
    def setUp(self):
        # Define a dummy REDIS instance
        self.host = 'localhost'
        self.port = '9999'
        self.password = 'strong_secret'
        self.acl_username = 'master'
        self.acl_password = 'acl_user_secret'
        self.ssl_flag = False

        # Override the settings value
        self.redis_url = "redis%s://%s:%s/?password=%s" % (
            ('s' if self.ssl_flag else ''),
            self.host,
            self.port,
            self.password
        )

    def test_lazy_load_no_init(self):
        """
        Test that just retrieving an instance does not open the connection
        """
        cache = Cache()
        self.assertIsNone(cache._redis)

    def test_get_internal_instance_with_generic_password(self):
        # Mock the Redis __init__ method
        cache = Cache()
        mock_redis = mock.Mock()
        mock_redis.mock_init.return_value = None
        with mock.patch.object(Redis, "__init__", mock_redis.mock_init):
            cache._REDIS_URL = self.redis_url
            cache._get_redis()

        # Check the initiatialization
        mock_redis.mock_init.assert_called_once_with(
            host=self.host,
            port=self.port,
            password=self.password,
            ssl=False
        )
        self.assertIsNotNone(cache._redis)

    def test_get_internal_instance_no_password(self):
        # Mock the Redis __init__ method
        cache = Cache()
        mock_redis = mock.Mock()
        mock_redis.mock_init.return_value = None
        with mock.patch.object(Redis, "__init__", mock_redis.mock_init):
            cache._REDIS_URL = "redis://%s:%s" % (self.host, self.port)
            cache._get_redis()

        # Check the initiatialization
        mock_redis.mock_init.assert_called_once_with(
            host=self.host,
            port=self.port,
            ssl=False
        )
        self.assertIsNotNone(cache._redis)

    def test_get_internal_instance_with_acl_enabled(self):
        # Mock the Redis excute_command method
        cache = Cache()
        mock_redis = mock.Mock()
        mock_redis.mock_init.return_value = None
        with mock.patch.object(Redis, "execute_command", mock_redis.mock_init):
            cache._REDIS_URL = "redis://%s:%s@%s:%s" % (
                    self.acl_username,
                    self.acl_password,
                    self.host,
                    self.port
                )
            cache._get_redis()

        # Check the initiatialization
        mock_redis.mock_init.assert_called_once_with(
            f"AUTH {self.acl_username} {self.acl_password}"
        )
        self.assertIsNotNone(cache._redis)

    def test_get_internal_instance_with_ssl_enabled(self):
        # Mock the Redis __init__ method
        cache = Cache()
        mock_redis = mock.Mock()
        mock_redis.mock_init.return_value = None
        with mock.patch.object(Redis, "__init__", mock_redis.mock_init):
            cache._REDIS_URL = "rediss://%s:%s" % (self.host, self.port)
            cache._get_redis()

        # Check the initiatialization
        mock_redis.mock_init.assert_called_once_with(
            host=self.host,
            port=self.port,
            ssl=True
        )
        self.assertIsNotNone(cache._redis)

    def test_store_and_retrieve(self):
        """
        Test that retrieving a client establishes the connection
        """
        dummy_object = {
            'dummy': 0
        }
        cache = Cache()
        cache._REDIS_URL = self.redis_url

        mock_redis = mock.Mock()
        mock_redis.mock_init.return_value = None
        with mock.patch.object(Redis, "__init__", mock_redis.mock_init):

            # Store an object
            with mock.patch('redis.Redis.set') as mock_set:
                mock_set.return_value = None
                cache.store('my_key', dummy_object)
                mock_set.assert_called_once_with('my_key', json.dumps(dummy_object), ex=cache._DEFAULT_RETENTION_TIME)

            # Check that the connection was established
            mock_redis.mock_init.assert_called_once_with(
                host=self.host,
                port=self.port,
                password=self.password,
                ssl=False
            )
            self.assertIsNotNone(cache._redis)

            # Retrieve an object
            with mock.patch('redis.Redis.get') as mock_get:
                mock_get.return_value = json.dumps(dummy_object)
                cache.retrieve('my_key')
                mock_get.assert_called_once_with('my_key')
