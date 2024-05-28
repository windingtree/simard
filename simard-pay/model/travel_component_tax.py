from .exception import SimardException
from decimal import Decimal


class TravelComponentTaxException(SimardException):
    pass

MANDATORY_KEYS = [
    'amount',
]

KEY_TYPES = {
    'amount': Decimal,
    'iataCode': str,
    'taxId': str,
    'countryCode': str,
    'percentageRate': Decimal
}

class TravelComponentTax(object):
    def __init__(self, tax_dict: dict):
        TravelComponentTaxException.check_mandatory_keys(MANDATORY_KEYS, tax_dict)

        # Validate References
        for key in KEY_TYPES:
            if key in tax_dict:
                expected_type = KEY_TYPES[key]
                if (type(tax_dict[key]) is str) and (expected_type is Decimal):
                    tax_dict[key] = Decimal(tax_dict[key])
                if type(tax_dict[key]) is not expected_type:
                    raise TravelComponentTaxException('Travel Component Tax \'%s\' is not %s.' % (key, expected_type), 500)
                if expected_type == 'Decimal' and tax_dict[key] < Decimal(0):
                    raise TravelComponentTaxException('Travel Component Tax \'%s\' must be positive' % key, 500)

        self._tax_dict = tax_dict

    def to_dict(self):
        return self._tax_dict

    def get_key(self, reference_key):
        if reference_key in self._tax_dict:
            return self._tax_dict[reference_key]
        return None

    @property
    def amount(self):
        return self.get_key('amount')

    @property
    def iata_code(self):
        return self.get_key('iataCode')

    @property
    def tax_id(self):
        return self.get_key('taxId')

    @property
    def country_code(self):
        return self.get_key('countryCode')

    @property
    def percentage_rate(self):
        return self.get_key('percentageRate')

    @property
    def is_value_added(self):
        return self.tax_id == 'value_added'
