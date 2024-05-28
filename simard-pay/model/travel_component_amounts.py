from .exception import SimardException
from decimal import Decimal, InvalidOperation
from .travel_component_tax import TravelComponentTax
from typing import List

class TravelComponentAmountsException(SimardException):
    pass

MANDATORY_KEYS = [
    'total',
]

KEY_TYPES = {
    'total': Decimal,
    'base': Decimal,
    'taxes': list,
}


class TravelComponentAmounts(object):
    def __init__(self, amounts_dict: dict):
        # Check Mandatory keys
        TravelComponentAmountsException.check_mandatory_keys(MANDATORY_KEYS, amounts_dict)

        self._amounts_dict = {}

        # Validate References
        for key in KEY_TYPES:
            if key in amounts_dict:
                try:
                    self._amounts_dict[key] = KEY_TYPES[key](amounts_dict[key])
                except InvalidOperation:
                    raise TravelComponentAmountsException('Travel Component Amount \'%s\' amount is not Decimal: %s' % (key, amounts_dict[key]), 400)

                expected_type = KEY_TYPES[key]
                if type(self._amounts_dict[key]) != expected_type:
                    raise TravelComponentAmountsException('Travel Component Amount \'%s\' amount is not %s but %s' % (key, expected_type, type(self._amounts_dict[key]).__name__), 400)
                if expected_type == Decimal and self._amounts_dict[key] <= Decimal(0):
                    raise TravelComponentAmountsException('Travel Component Amount \'%s\' amount must be stricly positive' % key, 400)

    def to_dict(self):
        return self._amounts_dict

    def get_key(self, reference_key):
        if reference_key in self._amounts_dict:
            return self._amounts_dict[reference_key]
        return None

    @property
    def total(self) -> Decimal:
        return self.get_key('total')

    @property
    def base(self) -> Decimal:
        return self.get_key('base')

    @property
    def taxes(self) -> List[TravelComponentTax]:
        taxes = []
        tax_dicts = self.get_key('taxes')
        if tax_dicts is not None:
            for tax_dict in tax_dicts:
                taxes.append(TravelComponentTax(tax_dict))
        return taxes
