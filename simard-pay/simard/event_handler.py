"""
Module that define an ES logging handler
Adapted from https://github.com/cmanaha/python-elasticsearch-logger
"""
import re
from elasticsearch import Elasticsearch
from elasticsearch import helpers as eshelpers
from simard.settings import ELASTIC_SEARCH_URL
from datetime import datetime, timezone
from enum import Enum
from threading import Lock, Timer
from flask import has_request_context, request, g
import traceback
from simard.did_resolver import DidResolver


class EventType(Enum):
    """
    Event Type to structure the events
    """
    EXCEPTION = 'exception'  # Exception event
    HTTP = 'http'            # HTTP Request processed


class EventRecord(object):
    """"
    A class to hold an event record
    """

    def __init__(
        self,
        event_type: EventType,
        index: str = None,
        pipeline: str = None
    ):
        """
        Base Constructor
        :param event_type The type of event
        :param index The ES index to use
        :param pipeline The ES Pipeline to use
        """
        self._type = event_type.value
        self._pipeline = pipeline
        self._index = index

    @classmethod
    def from_exception(cls, exception: Exception):
        """
        Create Event Record from an exception
        """
        record = cls(EventType.EXCEPTION)
        record.message = str(exception)
        record.traceback = traceback.format_exc()
        record._index = 'simard-exceptions'
        return record

    @classmethod
    def from_http_transaction(cls, code: int, message: str, elapsed: int):
        """
        Create Event Record from an HTTP transactin
        """
        record = cls(EventType.HTTP)
        record.message = message
        record.code = code
        record.elapsed = elapsed
        record._index = 'simard-events'
        return record

    def enrich(self):
        """
        Enrich a record with context information
        """
        if has_request_context():
            self.__enrich_request_data()

            # ORG.ID
            if hasattr(g, 'orgid'):
                # Get the ORG.ID Value
                self.orgid = g.orgid
                did_doc = DidResolver.resolve("did:orgid:%s" % self.orgid)

                # Get the DID Document
                if 'didDocument' in did_doc:
                    self.__enrich_did_data(did_doc)

    def __enrich_did_data(self, did_doc):
        self.did = {}
        # Legal Entity
        if 'legalEntity' in did_doc['didDocument']:
            # Legal Name
            if 'legalName' in did_doc['didDocument']['legalEntity']:
                self.did['name'] = did_doc['didDocument']['legalEntity']['legalName']

            # Legal Type
            if 'legalType' in did_doc['didDocument']['legalEntity']:
                self.did['type'] = did_doc['didDocument']['legalEntity']['legalType']

            # Address
            if 'registeredAddress' in did_doc['didDocument']['legalEntity'] and \
                    'country' in did_doc['didDocument']['legalEntity']['registeredAddress']:
                self.did['country'] = \
                    did_doc['didDocument']['legalEntity']['registeredAddress']['country']

    def __enrich_request_data(self):
        # Request URL
        if hasattr(request, 'url'):
            self.url = request.url
        # Remote IP
        if hasattr(request, 'remote_addr'):
            if re.match(r'^([0-9]{1,3}\.){3}[0-9]{1,3}$', request.remote_addr):
                self.remote = request.remote_addr
                self._pipeline = 'geoip'
            else:
                print("Unparsed remote: %s", request.remote_addr)
        # Request Method
        if hasattr(request, 'method'):
            self.method = request.method
        # Agent
        if hasattr(g, 'agent'):
            self.agent = g.agent


class EventHandler(object):
    """
    Logging Handler that send events to Elastic Search
    """

    # Parameters
    _BUFFER_SIZE = 10
    _FLUSH_FREQ_INSEC = 5
    _DEFAULT_ES_INDEX = 'simard-staging'
    _DEFAULT_ES_DOC_TYPE = 'test'
    _RAISE_ON_EXCEPTION = False
    _ELASTIC_SEARCH_URL = ELASTIC_SEARCH_URL

    def __init__(self):
        """
        Constructor for the event manager
        """
        self._es = None  # The Elastic Search client
        self._buffer = []  # The buffer of events to send to ES
        self._buffer_lock = Lock()  # A thread lock o the buffer
        self._timer = None  # The timer to schedule periodic flush()
        self.disabled = False  # Disable ESK events

    def get_es(self):
        """
        Get the ES client
        The approach allows to lazy load and mock the client
        """
        if self._es is None:
            # Parse Elastik URL format
            m = re.match(
                r'^http(?P<ssl>s)?://((?P<login>.+):(?P<password>.+)@)?(?P<host>[^:]+)(:(?P<port>\d+))?$',
                self._ELASTIC_SEARCH_URL
            )

            # If the URL is incorrect or not set, it disables Elastik
            if not m:
                self.disabled = True
                return None

            # Define the port
            if m.group('port'):
                port = int(m.group('port'))
            else:
                if m.group('ssl'):
                    port = 443
                else:
                    port = 80

            # Connect to cluster over SSL using auth
            es_header = [{
                'host': m.group('host'),
                'port': port,
                'use_ssl': (m.group('ssl') == 's')
            }]

            # Add Basic Auth credentials
            if m.group('login') and m.group('password'):
                es_header[0]['http_auth'] = (m.group('login'), m.group('password'))

            # Instantiate Elastic Search
            self._es = Elasticsearch(es_header)

        return self._es

    def _schedule_flush(self):
        """
        Internal scheduler for flush operations
        """
        if self._timer is None:
            self._timer = Timer(self._FLUSH_FREQ_INSEC, self.flush)
            self._timer.setDaemon(True)
            self._timer.start()

    def flush(self):
        """
        Flushes the buffer into ES
        """
        # Stop the timer
        if self._timer is not None and self._timer.is_alive():
            self._timer.cancel()
        self._timer = None

        # Process the buffer
        if self._buffer:
            try:
                # Get a lock on the buffer, empty and release
                with self._buffer_lock:
                    events_buffer = self._buffer
                    self._buffer = []

                # Prepare the actions
                actions = []
                for event_record in events_buffer:
                    action = {'_source': event_record._source}

                    # ES Index
                    if event_record._index is None:
                        action['_index'] = self._DEFAULT_ES_INDEX
                    else:
                        action['_index'] = event_record._index

                    # ES Doc Type
                    if event_record._type is None:
                        action['_type'] = self._DEFAULT_ES_DOC_TYPE
                    else:
                        action['_type'] = event_record._type

                    # ES Pipeline
                    if hasattr(event_record, '_pipeline'):
                        action['pipeline'] = event_record._pipeline

                    actions.append(action)

                # Bulk the events
                eshelpers.bulk(
                    client=self.get_es(),
                    actions=actions,
                    stats_only=False,
                    raise_on_error=True
                )

            except Exception as exception:
                if self._RAISE_ON_EXCEPTION:
                    raise exception

    def close(self):
        """
        Flushes the buffer and release any outstanding resource
        :return: None
        """
        if self._timer is not None:
            self.flush()

    def log_event(self, record: EventRecord):
        """
        Format and records the log
        :return: None
        """
        # Do nothing if disabled
        if self.disabled:
            return None

        # Enrich record
        record.enrich()

        # Format the event record
        rec = {}
        for key, value in record.__dict__.items():
            # Skip private keys
            if(key[0] == '_'):
                continue

            # Add the key value
            rec[key] = "" if value is None else value

        # Add the time
        rec['time'] = datetime.now(timezone.utc).isoformat()
        record._source = rec

        # Append the record in the buffer
        with self._buffer_lock:
            self._buffer.append(record)

        # Flush now if we have too many items
        if len(self._buffer) >= self._BUFFER_SIZE:
            self.flush()

        # Otherwise schedule the flush
        else:
            self._schedule_flush()

    def log_exception(self, exception: Exception):
        self.log_event(EventRecord.from_exception(exception))

    def log_http_transaction(
        self,
        status: int,
        message: str,
        elapsed: int
    ):
        self.log_event(EventRecord.from_http_transaction(status, message, elapsed))


es_handler = EventHandler()
