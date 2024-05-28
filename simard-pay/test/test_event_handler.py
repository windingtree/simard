import unittest
from unittest import mock
from simard.event_handler import EventHandler, EventRecord, EventType
from elasticsearch import Elasticsearch


class TestEventHandler(unittest.TestCase):
    @staticmethod
    def build_uri(
        host:str,
        port:int=None,
        use_ssl:bool=False,
        login:str=None,
        password:str=None
    ):
        # Create auth
        auth_str = ''
        if login and password:
            auth_str = '%s:%s@' % (login, password)

        # Create port
        port_str = ''
        if port:
            port_str = ':%d' % port

        return "http%s://%s%s%s" % (
            's' if use_ssl else '',
            auth_str,
            host,
            port_str
        )

    def setUp(self):
        self.use_ssl = True
        self.login = 'myLogin'
        self.password = 'myPassword'
        self.host = 'server.com'
        self.port = 9999
        self.elastic_url = TestEventHandler.build_uri(
            host=self.host,
            port=self.port,
            use_ssl=self.use_ssl,
            login=self.login,
            password=self.password
        )

    def test_lazy_load_no_init(self):
        """
        Test that just retrieving an instance does not open the connection
        """
        event_handler = EventHandler()
        self.assertIsNone(event_handler._es)

    def test_get_es_full(self):
        """
        Test retrieving an instance with all details
        """
        event_handler = EventHandler()
        mock_elastic = mock.Mock()
        mock_elastic.mock_init.return_value = None
        with mock.patch.object(Elasticsearch, "__init__", mock_elastic.mock_init):
            event_handler._ELASTIC_SEARCH_URL = self.elastic_url
            event_handler.get_es()

        # Check the initiatialization
        mock_elastic.mock_init.assert_called_once_with([{
                'host': self.host,
                'port': self.port,
                'use_ssl': self.use_ssl,
                'http_auth': (self.login, self.password)
            }])
        self.assertIsNotNone(event_handler._es)

    def test_get_es_full_no_ssl(self):
        """
        Test retrieving an instance without SSL
        """
        event_handler = EventHandler()
        mock_elastic = mock.Mock()
        mock_elastic.mock_init.return_value = None
        with mock.patch.object(Elasticsearch, "__init__", mock_elastic.mock_init):
            event_handler._ELASTIC_SEARCH_URL = TestEventHandler.build_uri(
                host=self.host,
                port=self.port,
                use_ssl=False,
                login=self.login,
                password=self.password
            )
            event_handler.get_es()

        # Check the initiatialization
        mock_elastic.mock_init.assert_called_once_with([{
            'host': self.host,
            'port': self.port,
            'use_ssl': False,
            'http_auth': (self.login, self.password)
        }])
        self.assertIsNotNone(event_handler._es)

    def test_get_es_full_no_ssl_no_auth(self):
        """
        Test retrieving an instance without SSL
        """
        event_handler = EventHandler()
        mock_elastic = mock.Mock()
        mock_elastic.mock_init.return_value = None
        with mock.patch.object(Elasticsearch, "__init__", mock_elastic.mock_init):
            event_handler._ELASTIC_SEARCH_URL = TestEventHandler.build_uri(
                host=self.host,
                port=self.port,
                use_ssl=False
            )
            event_handler.get_es()

        # Check the initiatialization
        mock_elastic.mock_init.assert_called_once_with([{
            'host': self.host,
            'port': self.port,
            'use_ssl': False
        }])
        self.assertIsNotNone(event_handler._es)

    def test_run_disabled(self):
        """
        Test it can be used disabled
        """
        event_handler = EventHandler()
        mock_elastic = mock.Mock()
        mock_elastic.mock_init.return_value = None
        with mock.patch.object(Elasticsearch, "__init__", mock_elastic.mock_init):
            event_handler._ELASTIC_SEARCH_URL = ''
            event_handler.get_es()

        # Check the initiatialization
        mock_elastic.mock_init.called = False
        self.assertIsNone(event_handler._es)
        event_handler.log_exception(Exception('boom'))
        event_handler.log_event(EventRecord(EventType.HTTP, 'http'))
