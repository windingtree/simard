from decimal import Decimal
from iso4217 import Currency

class MonetaryAmount(object):
    def __init__(self, currency: Currency, amount: Decimal):
        self.amount = amount
        self.currency_exponent = currency.exponent
        assert (self.amount * Decimal(10) ** self.currency_exponent) % 1 == Decimal(0), "Decimal units too large for currency"

    def __str__(self) -> str:
        amount_in_decimal_units = self.amount * Decimal(10) ** self.currency_exponent
        return(str(amount_in_decimal_units.to_integral_exact()))

    def zfill(self, width: int) -> str:
        return str(self).zfill(width)
