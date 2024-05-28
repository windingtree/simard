""""
Define a class to handle a virtual card
"""
from decimal import Decimal
from simard.settings import VIRTUAL_CARD_DETAILS


class VirtualCard(object):
    def __init__(
        self,
        account_number,
        cvv,
        currency,
        amount,
        expiration_month,
        expiration_year,
        guarantee_id,
        brand,
        card_type
    ):
        """
        Constructor for a virtual card object
        """
        self.currency = currency
        self.amount = Decimal(amount)
        self.expiration_month = expiration_month
        self.expiration_year = expiration_year
        self.guarantee_id = guarantee_id
        self.brand = brand
        self.account_number = account_number
        self.cvv = cvv
        self.card_type = card_type

    @classmethod
    def generate(
        cls,
        currency,
        amount,
        expiration,
        guarantee_id
    ):
        """
        Generate a virtual card
        TODO: Call true provider API
        """
        # Format 4444333322221111|10|2025|737|visa|debit
        card_details = VIRTUAL_CARD_DETAILS.split('|')
        return cls(
            account_number=card_details[0],
            expiration_month=card_details[1],
            expiration_year=card_details[2],
            cvv=card_details[3],
            brand=card_details[4],
            card_type=card_details[5],
            currency=currency,
            amount=amount,
            guarantee_id=guarantee_id
        )

    @classmethod
    def cancel(
        cls,
        guarantee_id
    ):
        """
        Cancel a virtual card
        TODO: Call true provider API
        """
        return True
