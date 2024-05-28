from hashlib import sha256
from enum import Enum
from .db import db
from pytz import timezone as timezone_picker
from datetime import datetime

class REPORTING_STATE(Enum):
    IN_PROGRESS = 0
    SUCCESS = 1
    FAILURE = 2

class Context(object):
    """
    TADC file database object
    """
    # static variable
    components_count_running_sequence = 0

    def __init__(self):
        # Reporting default values
        self.previous_cutoff_datetime = datetime.fromtimestamp(0)
        self.current_cutoff_datetime = datetime.now(timezone_picker("Europe/Tallinn"))
        self.message_sequence_number = 1
        self.travel_batch_sequence_number = 0
        self.travel_transaction_sequence_number = 0
        self.records = []
        self.transaction_counts = {}  # mapped my currency as key
        self.transaction_totals = {}  # mapped my currency as key

        # File Transfer default values
        self.file_hash = None
        self.transfer_date = None
        self.status = REPORTING_STATE.IN_PROGRESS
        self._id = None

        # Check latest report
        latest = db.tadc_reports.find_one({"status": REPORTING_STATE.SUCCESS.name}, sort=[('transferDate', -1)])
        if latest:
            self.message_sequence_number = latest['messageSequenceNumber'] + 1
            self.batch_sequence_number = latest['batchSequenceNumber'] + 1
            self.transaction_sequence_number = latest['transactionSequenceNumber']
            self.previous_cutoff_datetime = latest['cutOffDatetime']
