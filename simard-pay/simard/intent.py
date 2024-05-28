""""
Define a class to manage the intent object
"""
from decimal import Decimal
from model.exception import SimardException
from .db import db
from .parser import Parser
import requests
from .settings import PCIPROXY_API_3DS_URL, PCIPROXY_API_USERNAME, PCIPROXY_API_PASSWORD

class IntentException(SimardException):
    pass


class Intent(object):
    """
    Define a payment intent
    """
    def __init__(self, intent_dict: dict):
        # Parse the amount
        for key in ['amount', 'currency', 'returnUrl', 'providerCode']:
            if key not in intent_dict.keys():
                raise IntentException("Intent is missing %s" % key, 400)

        self._intent_dict = {
            'amount': str(Parser.parse_amount(intent_dict['amount'])),
            'currency': Parser.parse_currency(intent_dict['currency']),
            'returnUrl': str(intent_dict['returnUrl']),
            'providerCode': str(intent_dict['providerCode']),
        }
        self._id = None

    def get_intent_key(self, key):
        if key in self._intent_dict:
            return self._intent_dict[key]
        return None

    @property
    def amount(self) -> Decimal:
        return Decimal(self.get_intent_key('amount'))

    @property
    def currency(self) -> str:
        return self.get_intent_key('currency')

    @property
    def return_url(self) -> str:
        return self.get_intent_key('returnUrl')

    @property
    def provider_code(self) -> str:
        return self.get_intent_key('providerCode')

    @property
    def transaction_id(self) -> str:
        return self.get_intent_key('transactionId')

    @property
    def card(self) -> dict:
        return self.get_intent_key('card')

    def store(self):
        """
        Store an intent in database
        """
        # Before storing, a transactionId must have been created
        if self.transaction_id is None:
            raise IntentException('missing transactionId to store an intent')

        if self._id is None:
            result = db.intents.insert_one(self._intent_dict)
            self._id = result.inserted_id

        # For an update, update the values
        else:
            db.intents.update_one(
                {
                    "_id": self._id
                }, {
                    "$set": self._intent_dict
                },
                upsert=True
            )

    @classmethod
    def from_storage(cls, transaction_id: str) -> 'Intent':
        # Get the intent from DB
        result = db.intents.find_one({"transactionId": str(transaction_id)})

        # Handle the not found error
        if result is None:
            raise IntentException('intent not found', 404)

        intent = cls(result)
        intent._id = result['_id']
        intent._intent_dict['transactionId'] = result['transactionId']

        return intent

    def initiate_three_domain_secure_secure_fields(self):
        """
        Publish the intent as 3DS to PCI-Proxy
        """
        # Check if the intent is not already published
        if 'transactionId' in self._intent_dict:
            raise IntentException('3DS Intent is already published', 400)

        # Make the request to Datatrans
        r = requests.post(
            PCIPROXY_API_3DS_URL + '/secureFields',
            json={
                # https://docs.pci-proxy.com/authenticate/3d-secure-fields-js
                "amount": self.amount,
                "currency": self.currency,
                "returnUrl": self.return_url,
            },
            auth=(PCIPROXY_API_USERNAME, PCIPROXY_API_PASSWORD)
        )

        # Check the status code
        if not r.ok:
            raise IntentException("Could not create the intent [%i:%s]" % (r.status_code, r.text), 502)

        # Update the transactionID
        self._intent_dict['transactionId'] = r.json()['transactionId']

    def validate_three_domain_secure_secure_fields(self):
        """
        Validate 3DS to PCI-Proxy
        """
        # Check if the intent is not already published
        if 'transactionId' not in self._intent_dict:
            raise IntentException('3DS Intent not yet published', 400)

        # Make the request to Datatrans
        r = requests.get(
            PCIPROXY_API_3DS_URL + '/' + self.transaction_id,
            auth=(PCIPROXY_API_USERNAME, PCIPROXY_API_PASSWORD)
        )

        # Check the status code
        if not r.ok:
            raise IntentException("Could not validate the intent [%i:%s]" % (r.status_code, r.text), 502)

        # Update the 3DS data
        self._intent_dict['card'] = r.json()['card']

        # Check if aliasCVV has not been removed
        if 'aliasCVV' not in self.card:
            raise IntentException('3DS Intent is outdated', 400)
