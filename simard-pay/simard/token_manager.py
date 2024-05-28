# libraries
from iso4217 import Currency
import requests
from datetime import datetime

from .datatrans_tokenizer import CardNumberAndCVV, DataTransTokenizer
# inner modules
from .parser import Parser
from .token import Token, BillingAddress, CardData
from model.exception import SimardException
from model import CustomerReferences
from .travel_component import TravelComponent, TravelComponentException
from .amex import Amex, AmexException
from .intent import Intent, IntentException
from .profile import Profile, ProfileException

from .settings import (
    PCIPROXY_API_SERVICES_URL,
    PCIPROXY_API_USERNAME,
    PCIPROXY_API_PASSWORD,
)

class TokenManagerException(SimardException):
    pass

def payment_method_to_brand(payment_method):
    payment_methods = {
        'VIS': 'visa',
        'ECA': 'mastercard',
        'AMX': 'amex',
        'DIN': 'diners',
        'DIS': 'discover',
        'JCB': 'jcb',
        'CUP': 'unionpay',
        'UAP': 'uatp'
    }

    try:
        return payment_methods[payment_method]
    except KeyError:
        raise TokenManagerException('Card Brand Not supported', 400)

def get_token_data(secure_field_transaction_id) -> dict:
    """
    Get a token from the transaction ID
    """
    # Retrieve the data from the token
    # https://docs.pci-proxy.com/collect-and-store-cards/capture-iframes#4-obtain-tokens
    r = requests.get(
        PCIPROXY_API_SERVICES_URL + '/inline/token',
        params={
            'transactionId': secure_field_transaction_id,
            'returnPaymentMethod': True,
            'returnCardInfo': True,
        },
        auth=(PCIPROXY_API_USERNAME, PCIPROXY_API_PASSWORD)
    )

    # Verify the response code
    # https://docs.pci-proxy.com/collect-and-store-cards/capture-iframes#error-table
    if(r.status_code != 200):
        if(r.text == 'Tokenization expired'):
            raise TokenManagerException(
                'Secure Field TransactionId has exceeded the 30 minutes time limit',
                400
            )

        elif(r.text == 'Tokenization not found'):
            raise TokenManagerException(
                'Secure Field TransactionId not found or not compatible with Simard Pay',
                404
            )

        raise TokenManagerException(
            'Error when retrieving card token [%s]' % r.text,
            502
        )

    # Extract values from PCI-Proxy response
    return r.json()

class TokenManager(object):

    # Create a card guarantee
    @staticmethod
    def create_token(
        creator_orgid,
        receiver_orgid,
        agent,
        secure_field_transaction_id,
        expiry_month,
        expiry_year,
        cardholder_name,
        billing_address_dict,
    ):
        """
        Create a card guarantee
        """
        # Parse all fields for security
        creator_orgid = Parser.parse_orgid(creator_orgid)
        receiver_orgid = Parser.parse_orgid(receiver_orgid)
        agent = Parser.parse_agent(agent)
        secure_field_transaction_id = Parser.parse_integer(secure_field_transaction_id)
        expiry_month = Parser.parse_month(expiry_month)
        expiry_year = Parser.parse_year(expiry_year)
        cardholder_name = Parser.parse_cardholder_name(cardholder_name)
        billing_address_dict = Parser.parse_billing_address(billing_address_dict)

        # Retrieve the token data from API
        card_data = None
        try:
            # Attempt to get the card details from the intent
            intent = Intent.from_storage(secure_field_transaction_id)
            intent.validate_three_domain_secure_secure_fields()
            card_data = CardData(
                alias_cc=intent.card['alias'],
                alias_cvv=intent.card['aliasCVV'],
                brand=intent.card['info']['brand'].lower(),
                card_type=intent.card['info']['type'],
                masked_card=intent.card['masked'].upper(),
                expiry_month=expiry_month,
                expiry_year=expiry_year,
                cardholder_name=cardholder_name,
                three_domain_secure=intent.card['3D']
            )
        except IntentException as e:
            print(e)
            token_data = get_token_data(secure_field_transaction_id)
            card_data = CardData(
                alias_cc=token_data['aliasCC'],
                alias_cvv=token_data['aliasCVV'],
                brand=payment_method_to_brand(token_data['paymentMethod']),
                card_type=token_data['cardInfo']['type'],
                masked_card=token_data['maskedCard'].upper(),
                expiry_month=expiry_month,
                expiry_year=expiry_year,
                cardholder_name=cardholder_name,
            )

        # Create the card guarantee
        token = Token(
            creator=creator_orgid,
            receiver=receiver_orgid,
            agent=agent,
            card_data=card_data,
            billing_address=BillingAddress(
                country_code=billing_address_dict['countryCode'],
                state_prov=billing_address_dict['stateProv'],
                postal_code=billing_address_dict['postalCode'],
                city_name=billing_address_dict['cityName'],
                street=billing_address_dict['street']
            )
        )
        token.store()

        return token

    # Retrieve a token
    @staticmethod
    def retrieve_token(
        orgid,
        agent,
        token_uuid
    ):
        """
        Retrieve a token
        """
        # Parse all fields for security
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        token_uuid = Parser.parse_uuid(token_uuid)

        # Retrieve the guarantee
        token = Token.from_storage(token_uuid)

        # Check the token exists
        if token is None:
            raise TokenManagerException('Token not found', 404)

        # Check the token can be accessed
        if orgid not in [token.creator, token.receiver]:
            raise TokenManagerException('Token access denied', 403)

        # Return the guarantee
        return token

    # Delete a token
    @staticmethod
    def delete_token(
        orgid,
        agent,
        token_uuid
    ):
        """
        Deletes a token
        """
        # Parse all fields for security
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        token_uuid = Parser.parse_uuid(token_uuid)

        # Retrieve the token
        token = Token.from_storage(token_uuid)

        # Check the token exists
        if token is None:
            raise TokenManagerException('Token not found', 404)

        # Check the token can be accessed
        if token.creator != orgid:
            raise TokenManagerException('Token access denied', 403)

        # Delete the token
        token.delete()

    @staticmethod
    def create_travel_account_token(
        creator_orgid,
        agent,
        receiver_orgid,
        currency,
        amount,
        customer_references
    ):

        # Parse the input values for safety
        amount = Parser.parse_amount(amount)
        currency = Currency(currency)
        creator_orgid = Parser.parse_orgid(creator_orgid)
        receiver_orgid = Parser.parse_orgid(receiver_orgid)
        agent = Parser.parse_agent(agent)
        customer_references = CustomerReferences(customer_references)
        cost_center = customer_references.cost_center

        # Retrieve the Profile
        try:
            profile = Profile.from_storage(creator_orgid)
        except ProfileException as e:
            raise TokenManagerException('Profile required to create travel account', 403) from e

        card_data = None
        amex_token_data = None
        if profile.amex is not None:
            # Create a token with Amex Smart Token
            (token_data, amex_token_data) = Amex.create_travel_account(
                amount=amount,
                currency=currency,
                cost_center=cost_center,
                customer_references=customer_references,
            )

            # convert from MM/YYYY to MMYYYY
            token_expiry_date = datetime.strptime(token_data['expiry'], '%m/%Y')
            token_expiry_date = token_expiry_date.strftime('%m%Y')

            masked_card=token_data.get('maskedCard', None)
            if masked_card is not None:
                masked_card = masked_card.upper()
            # Create the card data object
            card_data = CardData(
                alias_cc=token_data['aliasCC'],
                alias_cvv=token_data['aliasCVV'],
                brand=payment_method_to_brand(token_data['paymentMethod']),
                card_type='debit',
                masked_card=masked_card,
                expiry_month=token_expiry_date[:2],
                expiry_year=token_expiry_date[2:],
                cardholder_name='EYUS_WINDINGTREE',
                cc=token_data['cc'],
                cvv=token_data['cvv'],
            )
            # check if property 'masked_card' exists in card_data


        elif profile.card_data is not None:
            # Use the card data from the profile
            card_data = profile.card_data
            try:
                to_tokenize = CardNumberAndCVV(cc=card_data.cc, cvv=card_data.cvv)
                tokenized = DataTransTokenizer.tokenize_card(to_tokenize)
                card_data.masked_card = tokenized.masked_number
                card_data.alias_cc = tokenized.cc_alias
                card_data.alias_cvv = tokenized.cvv_alias
            except Exception:
                raise AmexException('Unable to tokenize card',502)

        else:
            raise TokenManagerException('Profile configuration missing to create travel account', 403)

        # Create the token
        token = Token(
            creator=creator_orgid,
            receiver=receiver_orgid,
            is_amex_token=True,
            amount=amount,
            currency=currency,
            agent=agent,
            card_data=card_data,
            billing_address=profile.billing_address,
            customer_references=customer_references,
            amex_token_data=amex_token_data
        )
        token.store()

        return token

    @staticmethod
    def add_travel_components(orgid, agent, token_uuid, travel_components):
        """
        Update the travel components for a (travel-account) token
        """
        token = TokenManager.retrieve_token(orgid, agent, token_uuid)

        # create travel components with the given data
        components = []
        for i, travel_component in enumerate(travel_components):
            try:
                components.append(TravelComponent.from_dict(travel_component))
            except ValueError as e:
                raise TokenManagerException(
                    f'Invalid travel component at index: {i}: {e}',
                    400
                )
            except KeyError as e:
                raise TokenManagerException(
                    f'Missing travel component key at index: {i}: {e}',
                    400
                )
            except TravelComponentException as e:
                raise TokenManagerException(
                    f'Invalid travel component at index: {i} {e.description}',
                    400
                )

        # validate the components
        for i, travel_component in enumerate(components):
            if not travel_component.validate():
                raise TokenManagerException(
                    f'Cannot validate travel component at index: {i}',
                    400
                )

        token.travel_components.extend(components)
        token.store()
        travel_components_dicts = []
        for travel_component in token.travel_components:
            travel_components_dicts.append(travel_component.get_dict())

        return travel_components_dicts

    @staticmethod
    def get_travel_components(orgid, agent, token_uuid):
        """
        Get travel components for a (travel-account) token
        """
        token = TokenManager.retrieve_token(orgid, agent, token_uuid)
        travel_components_dicts = []
        for travel_component in token.travel_components:
            travel_components_dicts.append(travel_component.get_dict())

        return travel_components_dicts
