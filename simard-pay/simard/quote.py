""""
Define a class to manage the quote object
"""
import requests
from simard.settings import TRANSFERWISE_API_ENDPOINT
from simard.settings import TRANSFERWISE_API_TOKEN
from simard.settings import TRANSFERWISE_PROFILE_ID
from model.exception import SimardException
from simard.db import db
from simard.did_resolver import DidResolver
import uuid
from decimal import Decimal
from bson.decimal128 import Decimal128
import simplejson as json

class QuoteException(SimardException):
    pass


class Quote(object):

    def __init__(
        self,
        orgid,
        agent,
        source_currency,
        target_currency,
        source_amount=None,
        target_amount=None,
    ):
        # Check that both target and source are not set
        if (source_amount is not None) and (target_amount is not None):
            raise QuoteException('Target and Source amounts can not be set simultaneously', 400)

        # Check that both target and source are not set
        if (source_amount is None) and (target_amount is None):
            raise QuoteException('Target or Source amounts should be set', 400)

        # Update values from constructor
        self.orgid = orgid
        self.agent = agent
        self.source_currency = source_currency
        self.target_currency = target_currency
        self.source_amount = source_amount
        self.target_amount = target_amount

        # Default values
        self.transferwise_id = None
        self.rate = None
        self.is_used = False
        self.uuid = str(uuid.uuid4())
        self._id = None

    def create_transferwise(self):
        # Check the quote is not already created
        if self.transferwise_id is not None:
            raise QuoteException('Quote has already been provided', 500)

        # Check if we have exactly one amount
        if(self.source_amount is None) and (self.target_amount is None):
            raise QuoteException('Missing an amount to create a quote', 500)

        # Check that both target and source are not set
        if (self.source_amount is not None) and (self.target_amount is not None):
            raise QuoteException('Target and Source amounts can not be set simultaneously', 500)

        transferwise_payload = {
            "profile": int(TRANSFERWISE_PROFILE_ID),
            "source": self.source_currency,
            "target": self.target_currency,
            "rateType": "FIXED",
            "type": "BALANCE_CONVERSION"
        }

        if self.source_amount is not None:
            transferwise_payload['sourceAmount'] = self.source_amount
        if self.target_amount is not None:
            transferwise_payload['targetAmount'] = self.target_amount

        # Fire the request to Transferwise
        r = requests.post(
            TRANSFERWISE_API_ENDPOINT + '/quotes',
            json=transferwise_payload,
            headers={
                'Authorization': ("Bearer %s" % TRANSFERWISE_API_TOKEN),
                'Content-Type': 'application/json'
            }
        )

        # Verify the response code
        if(r.status_code != 200):
            raise QuoteException(
                'Error when creating account [%s]' % r.text,
                500
            )

        # Extract values from Transferwise quote
        # Use simplejson lib instead of requests to force use of decimals
        tranferwise_quote = json.loads(r.text, use_decimal=True)

        self.transferwise_id = tranferwise_quote['id']
        if self.source_amount is None:
            self.source_amount = Decimal(tranferwise_quote['sourceAmount'])
        if self.target_amount is None:
            self.target_amount = Decimal(tranferwise_quote['targetAmount'])
        self.rate = tranferwise_quote['rate']

        return self

    def store(self):
        """
        Store the quote in Database
        """
        # Check we can not store without a rate and transferwise id
        if(self.rate is None) or (self.transferwise_id is None):
            raise QuoteException('Technical issue while storing quote references', 500)

        # Check we can not store without both source and target amounts
        if(self.source_amount is None) or (self.target_amount is None):
            raise QuoteException('Technical issue while storing quote amounts', 500)

        # Prepare the document to store
        document = {
            'uuid': self.uuid,
            'orgid': self.orgid,
            'agent': self.agent,
            'sourceCurrency': self.source_currency,
            'targetCurrency': self.target_currency,
            'sourceAmount': Decimal128(self.source_amount),
            'targetAmount': Decimal128(self.target_amount),
            'rate': Decimal128(self.rate),
            'transferwiseId': self.transferwise_id,
            'isUsed': self.is_used,
        }

        # For a new insertion, update the internal DB identifier
        if(self._id is None):
            result = db.quotes.insert_one(document)
            self._id = result.inserted_id

        # For an update, update the values
        else:
            db.quotes.update_one(
                {'uuid': self.uuid},
                {'$set': document}
            )

        return self

    @classmethod
    def from_storage(cls, quote_uuid):
        """
        Create the object from storage
        """
        # Get the quote from DB
        result = db.quotes.find_one({'uuid': quote_uuid})

        # Check if we have a value
        if result is None:
            return None

        # Create the object
        quote = cls(
            orgid=result['orgid'],
            agent=result['agent'],
            source_currency=result['sourceCurrency'],
            target_currency=result['targetCurrency'],
            source_amount=result['sourceAmount'].to_decimal(),
        )

        # Update reference values
        quote.target_amount = result['targetAmount'].to_decimal()
        quote.rate = result['rate'].to_decimal()
        quote.transferwise_id = result['transferwiseId']
        quote.is_used = result["isUsed"]
        quote.uuid = quote_uuid
        quote._id = result["_id"]

        return quote

    def execute(self):
        """
        Mark a quote as used
        """
        # Check if the quote has been priced
        if self.transferwise_id is None:
            raise QuoteException('Technical issue while executing quote exchange', 500)

        # Check if the quote is already used
        if self.is_used:
            raise QuoteException('Quote has already been used for an exchange', 400)

        # TODO: Initiate the transfer with Transferwise

        self.is_used = True
        return self
