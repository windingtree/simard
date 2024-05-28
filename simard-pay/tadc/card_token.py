from iso4217 import Currency
from decimal import Decimal
from .monetary_amount import MonetaryAmount
from model import CustomerReferences
from uuid import UUID

class CardData(object):
    def __init__(self, mongo_dict: dict):
        self.mongo_dict = mongo_dict

    @classmethod
    def from_dict(cls, mongo_dict: dict):
        return cls(mongo_dict)

    @property
    def expiry_month(self):
        return self.mongo_dict['expiryMonth']

    @property
    def expiry_year(self):
        return self.mongo_dict['expiryYear']

    @property
    def alias_cc(self):
        return self.mongo_dict['aliasCc']


class CardToken(object):
    def __init__(
        self,
        card_data: CardData,
        customer_references: CustomerReferences,
        currency: Currency,
        amount: MonetaryAmount,
        uuid: UUID
    ):
        self.card_data = card_data
        self.customer_references = customer_references
        self.amount = amount
        self.currency = currency
        self.uuid = uuid

    @classmethod
    def from_aggregate_dict(cls, mongo_dict: dict):
        currency = Currency(mongo_dict['currency'])

        # Default customer references when missing
        customer_references_dict = mongo_dict['customerReferences'] if 'customerReferences' in mongo_dict else {}
        if 'travellerLastName' not in customer_references_dict:
            customer_references_dict['travellerLastName'] = "DUMMY"
        if 'travellerFirstName' not in customer_references_dict:
            customer_references_dict['travellerFirstName'] = "DUMMY"

        return cls(
            card_data=CardData(mongo_dict['cardData']),
            customer_references=CustomerReferences(customer_references_dict),
            currency=currency,
            amount=MonetaryAmount(currency, Decimal(mongo_dict['amount'])),
            uuid=UUID(mongo_dict['uuid']),
        )

    @classmethod
    def from_aggregate_list(cls, mongo_list: list):
        tokens = []
        for mongo_dict in mongo_list:
            tokens.append(CardToken.from_aggregate_dict(mongo_dict))
        return tokens
