""""
Define a class to manage the profile object
"""
from decimal import Decimal
from model.exception import SimardException
from .db import db
from .parser import Parser
from .token import CardData, BillingAddress


class ProfileException(SimardException):
    pass


class Profile(object):
    """
    Define a profile
    """
    def __init__(self, profile_dict: dict, id: str = None):
        # Parse the amount
        for key in ['orgid']:
            if key not in profile_dict.keys():
                raise ProfileException("Profile is missing %s" % key, 400)

        self._profile_dict = {
            'orgid': str(Parser.parse_orgid(profile_dict['orgid'])),
        }

        for optional_key in ['cardData', 'billingAddress', 'amex']:
            if optional_key in profile_dict.keys():
                self._profile_dict[optional_key] = profile_dict[optional_key]

        self._id = id

    def get_profile_key(self, key):
        if key in self._profile_dict:
            return self._profile_dict[key]
        return None

    @property
    def orgid(self) -> str:
        return self.get_profile_key('orgid')

    @property
    def card_data(self) -> CardData:
        card_data_dict = self.get_profile_key('cardData')
        if card_data_dict is None:
            return None

        return CardData(
            alias_cc=card_data_dict['aliasCC'],
            alias_cvv=card_data_dict['aliasCVV'],
            brand=card_data_dict['brand'],
            card_type=card_data_dict['type'],
            masked_card=card_data_dict['maskedCard'],
            expiry_month=card_data_dict['expiryMonth'],
            expiry_year=card_data_dict['expiryYear'],
            cardholder_name=card_data_dict['cardholderName'],
            cc=card_data_dict['cc'],
            cvv=card_data_dict['cvv'],
        )

    @property
    def billing_address(self) -> BillingAddress:
        billing_address_dict = self.get_profile_key('billingAddress')
        if billing_address_dict is None:
            return None

        return BillingAddress(
            country_code=billing_address_dict['countryCode'],
            state_prov=billing_address_dict['stateProv'],
            postal_code=billing_address_dict['postalCode'],
            city_name=billing_address_dict['cityName'],
            street=billing_address_dict['street'],
        )

    @property
    def amex(self) -> dict:
        return self.get_profile_key('amex')

    def store(self):
        """
        Store a profile in database
        """
        if self._id is None:
            result = db.profiles.insert_one(self._profile_dict)
            self._id = result.inserted_id

        # For an update, update the values
        else:
            db.profiles.update_one(
                {
                    "_id": self._id
                }, {
                    "$set": self._profile_dict
                },
                upsert=True
            )

    @classmethod
    def from_storage(cls, orgid: str) -> 'Profile':
        # Get the profile from DB
        result = db.profiles.find_one({"orgid": str(orgid)})

        # Handle the not found error
        if result is None:
            raise ProfileException('profile not found', 404)

        profile = cls(result, result['_id'])
        return profile
