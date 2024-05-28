""""
Define a class to manage the Token object
"""
from datetime import datetime
import uuid
from iso4217 import Currency
from model.exception import SimardException
from .db import db
from model.customer_references import CustomerReferences
from .travel_component import TravelComponent
from decimal import Decimal
from typing import List


class TokenException(SimardException):
    pass

class BillingAddress(object):
    def __init__(
        self,
        country_code,
        state_prov,
        postal_code,
        city_name,
        street
    ):
        self.country_code = country_code
        self.state_prov = state_prov
        self.postal_code = postal_code
        self.city_name = city_name
        self.street = street


class CardData(object):
    def __init__(
        self,
        alias_cc,
        alias_cvv,
        brand,
        card_type,
        masked_card,
        expiry_month,
        expiry_year,
        cardholder_name,
        three_domain_secure=None,
        cc=None,
        cvv=None
    ):
        self.alias_cc = alias_cc
        self.alias_cvv = alias_cvv
        self.brand = brand
        self.card_type = card_type
        self.masked_card = masked_card
        self.expiry_month = expiry_month
        self.expiry_year = expiry_year
        self.cardholder_name = cardholder_name
        self.three_domain_secure = three_domain_secure
        self.cc = cc
        self.cvv = cvv


class Token(object):
    """
    Define a token
    """
    def __init__(
        self,
        creator,
        receiver,
        agent,
        card_data: CardData,
        billing_address: BillingAddress,
        is_amex_token=False,
        currency: Currency = None,
        amount: Decimal = None,
        travel_components: List[TravelComponent] = [],
        customer_references: CustomerReferences = None,
        amex_token_data=None
    ):
        """
        Constructor for a new token
        """
        # Initialize from parameters
        self.creator = creator
        self.receiver = receiver
        self.agent = agent
        self.is_amex_token = is_amex_token
        self.currency = currency
        self.amount = amount
        self.card_data = card_data
        self.billing_address = billing_address
        self.travel_components = travel_components
        self.customer_references = customer_references
        self.amex_token_data = amex_token_data

        # Create default values
        self.uuid = str(uuid.uuid4())
        self._id = None

    def store(self):
        # For a new insertion, update the internal DB identifier
        token_data = {
            "creator": self.creator,
            "receiver": self.receiver,
            "agent": self.agent,
            "isAmexTravelAccountToken": self.is_amex_token,
            "cardData": {
                "aliasCc": self.card_data.alias_cc,
                "aliasCvv": self.card_data.alias_cvv,
                "brand": self.card_data.brand,
                "cardType": self.card_data.card_type,
                "maskedCard": self.card_data.masked_card,
                "expiryMonth": self.card_data.expiry_month,
                "expiryYear": self.card_data.expiry_year,
                "cardholderName": self.card_data.cardholder_name,
                "cc": self.card_data.cc,
                "cvv": self.card_data.cvv,
            },
            "billingAddress": {
                "countryCode": self.billing_address.country_code,
                "stateProv": self.billing_address.state_prov,
                "postalCode": self.billing_address.postal_code,
                "cityName": self.billing_address.city_name,
                "street": self.billing_address.street,
            },
            "travelComponents": [],
            "amexTokenData": self.amex_token_data
        }

        if self.currency is not None:
            token_data["currency"] = self.currency.code

        if self.amount is not None:
            token_data["amount"] = str(self.amount)

        if self.card_data.three_domain_secure is not None:
            token_data['cardData']['threeDomainSecure'] = self.card_data.three_domain_secure

        if self.customer_references is not None:
            token_data["customerReferences"] = self.customer_references.to_dict()

        for travel_component in self.travel_components:
            travel_component_dict = travel_component.get_dict()
            if 'amounts' in travel_component_dict:
                if 'total' in travel_component_dict['amounts']:
                    travel_component_dict['amounts']['total'] = str(travel_component_dict['amounts']['total'])
                if 'base' in travel_component_dict['amounts']:
                    travel_component_dict['amounts']['base'] = str(travel_component_dict['amounts']['base'])
            token_data["travelComponents"].append(travel_component_dict)

        if(self._id is None):
            result = db.tokens.insert_one({
                "uuid": self.uuid,
                "createdAt": datetime.utcnow().timestamp(),
                **token_data
            })
            self._id = result.inserted_id

        # For an update, update the values
        else:
            token_data["createdAt"] = datetime.utcnow().timestamp()
            print(f"Updating token in the DB, travel components:{token_data['travelComponents']}" )
            db.tokens.update_one(
                {
                    "uuid": self.uuid
                }, {
                    "$set": token_data
                },
                upsert=True
            )

        # Return self for chaining
        return self

    @classmethod
    def from_storage(cls, token_uuid):
        """
        Create the object from storage
        """
        # Get the guarantee from DB
        result = db.tokens.find_one({"uuid": token_uuid})

        # Handle the not found error
        if result is None:
            return None

        # Handle travel component amount conversion
        travel_components = []
        for travel_component_dict in result["travelComponents"]:
            if 'amounts' in travel_component_dict:
                for amount_key in ['total', 'base']:
                    if amount_key in travel_component_dict['amounts']:
                        travel_component_dict['amounts'][amount_key] = Decimal(travel_component_dict['amounts'][amount_key])
            travel_components.append(TravelComponent.from_dict(travel_component_dict))

        # Add 3DS Data
        three_domain_secure = None
        if 'threeDomainSecure' in result["cardData"]:
            three_domain_secure = result["cardData"]['threeDomainSecure']

        # Create the token
        token = cls(
            creator=result["creator"],
            receiver=result["receiver"],
            agent=result["agent"],
            is_amex_token=result["isAmexTravelAccountToken"],
            currency=Currency(result["currency"]) if 'currency' in result else None,
            amount=Decimal(result["amount"]) if 'amount' in result else None,
            card_data=CardData(
                alias_cc=result["cardData"]["aliasCc"],
                alias_cvv=result["cardData"]["aliasCvv"],
                brand=result["cardData"]["brand"],
                card_type=result["cardData"]["cardType"],
                masked_card=result["cardData"]["maskedCard"],
                expiry_month=result["cardData"]["expiryMonth"],
                expiry_year=result["cardData"]["expiryYear"],
                cardholder_name=result["cardData"]["cardholderName"],
                three_domain_secure=three_domain_secure,
                cc=result["cardData"].get("cc",''),
                cvv=result["cardData"].get("cvv",''),
            ),
            billing_address=BillingAddress(
                country_code=result["billingAddress"]['countryCode'],
                state_prov=result["billingAddress"]['stateProv'],
                postal_code=result["billingAddress"]['postalCode'],
                city_name=result["billingAddress"]['cityName'],
                street=result["billingAddress"]['street'],
            ),
            travel_components=travel_components,
            customer_references=CustomerReferences(result["customerReferences"]) if 'customerReferences' in result else None,
            amex_token_data=result["amexTokenData"] if 'amexTokenData' in result else None
        )

        # Update reference values
        token.uuid = token_uuid
        token._id = result["_id"]

        return token

    def json_dict(self):
        token_json_dict = {
            "id": self.uuid,
            "creatorOrgId": self.creator,
            "receiverOrgId": self.receiver,
            "brand": self.card_data.brand,
            "aliasAccountNumber": self.card_data.alias_cc,
            "maskedAccountNumber": self.card_data.masked_card,
            "expiryMonth": self.card_data.expiry_month,
            "expiryYear": self.card_data.expiry_year,
            "aliasCvv": self.card_data.alias_cvv,
            "type": self.card_data.card_type,
            'cardholderName': self.card_data.cardholder_name,
            'isAmexTravelAccountToken': self.is_amex_token,
            'billingAddress': {
                'countryCode': self.billing_address.country_code,
                'stateProv': self.billing_address.state_prov,
                'postalCode': self.billing_address.postal_code,
                'cityName': self.billing_address.city_name,
                'street': self.billing_address.street,
            },
        }

        if self.customer_references is not None:
            token_json_dict['customerReferences'] = self.customer_references.to_dict()

        if self.currency and self.amount:
            token_json_dict['currency'] = self.currency.code
            token_json_dict['amount'] = self.amount

        if self.card_data.three_domain_secure is not None:
            token_json_dict['threeDomainSecure'] = self.card_data.three_domain_secure

        return token_json_dict

    def delete(self):
        """
        Delete a token
        """
        db.tokens.delete_one({"uuid": self.uuid})
