""""
Define a class to manage the balance object
"""
from decimal import Decimal
from model.exception import SimardException
from simard.db import db
from bson.decimal128 import Decimal128
from enum import Enum


class BalanceFilter(Enum):
    CREDITED = 1
    DEBITED = 2
    RESERVED = 3
    CLAIMABLE = 4


class BalanceException(SimardException):
    pass


class Balance(object):
    """
    Stores the balance of a given ORG.ID in a given currency
    """
    def __init__(self, orgid, currency):
        self.orgid = orgid
        self.currency = currency

    @staticmethod
    def aggregate_with_filters(collection, filters):
        """
        Get an aggregate pipeline for a collection and filters
        """
        # https://docs.mongodb.com/manual/aggregation/
        result = collection.aggregate([
            # Match object
            {
                '$match': filters
            },

            # Group object
            {
                '$group': {
                    '_id': '$currency',
                    'total': {
                        '$sum': '$amount'
                    },
                }
            },
        ])

        # Compute the total of each currency
        totals = {}
        for doc in result:
            total = doc['total']
            currency = doc['_id']
            if type(total) is Decimal128:
                totals[currency] = total.to_decimal()
            else:
                totals[currency] = Decimal(total)

        # Return either zero, a single object or a dict
        nb_currencies = len(totals.keys())
        if nb_currencies == 0:
            return Decimal()
        elif nb_currencies == 1:
            return totals[currency]
        else:
            return totals

    def aggregate_settlements(self, balance_filter: BalanceFilter):
        """
        Allows to aggregate settlements
        """
        # Determine which key should be filtered
        if(balance_filter == BalanceFilter.CREDITED):
            prop = 'beneficiary'
        elif(balance_filter == BalanceFilter.DEBITED):
            prop = 'initiator'
        else:
            raise BalanceException('Unsupported balance filter', 500)

        # Execute the aggregate
        return Balance.aggregate_with_filters(
            collection=db.settlements,
            filters={
                'currency': self.currency,
                prop: self.orgid
            }
        )

    def aggregate_guarantees(self, balance_filter: BalanceFilter):
        """
        Allows to aggregate guarantees
        """
        # Determine the filter type
        if(balance_filter == BalanceFilter.CLAIMABLE):
            prop = 'beneficiary'
        elif(balance_filter == BalanceFilter.RESERVED):
            prop = 'initiator'
        else:
            raise BalanceException('Unsupported balance filter', 500)

        # Execute the aggregate
        return Balance.aggregate_with_filters(
            collection=db.guarantees,
            filters={
                'currency': self.currency,
                prop: self.orgid,
                'claimed': False,
            }
        )

    @property
    def credit(self):
        """
        Retrieve the total credited amount on the balance
        """
        return self.aggregate_settlements(BalanceFilter.CREDITED)

    @property
    def debit(self):
        """
        Retrieve the total debited amount on the balance
        """
        return self.aggregate_settlements(BalanceFilter.DEBITED)

    @property
    def total(self):
        """
        Retrieve the total amount on the balance
        """
        return self.credit - self.debit

    @property
    def reserved(self):
        """
        Retrieve the reserved amount
        """
        return self.aggregate_guarantees(BalanceFilter.RESERVED)

    @property
    def claimable(self):
        """
        Retrieve the amount that can be claimed
        """
        return self.aggregate_guarantees(BalanceFilter.CLAIMABLE)

    def guarantee_claimed(self, guarantee_uuid):
        """
        Return the amount that has been claimed for a guarantee
        """
        return Balance.aggregate_with_filters(
            collection=db.settlements,
            filters={
                'currency': self.currency,
                'beneficiary': self.orgid,
                'guarantee': guarantee_uuid
            }
        )

    @property
    def available(self):
        """
        Allows to retrieve the available amount
        Total amount minus reserved amount
        """
        # TODO: The aggregated query needs to be optimized
        # Current implementation makes 3 aggregate calls to the DB for this
        return self.total - self.reserved

    @classmethod
    def retrieve_all(cls, orgid):
        if not db.is_collection_created('settlements'):
            return []

        # A balance is returned if there is at least one settlement received
        result = db.settlements.aggregate([
            # Match object
            {
                '$match': {
                    'beneficiary': orgid,
                }
            },

            # Group object
            {
                '$group': {
                    '_id': '$currency',
                }
            },
        ])

        # All balances are created in a list and returned
        balances = []
        for doc in result:
            balances.append(cls(orgid, doc['_id']))

        return balances
