"""
Define a parser class to handle common operations
"""
import uuid
from datetime import datetime, timezone
from iso4217 import Currency
import dateutil.parser
from decimal import Decimal
import re
from model.exception import SimardException
from iso3166 import countries


class ParserException(SimardException):
    pass


class Parser(object):
    """
    Base class to ease the parsing
    """

    @staticmethod
    def parse_country_code(country_name):
        """
        Parse a country name and return the ISO 3166-1 alpha-2 code
        """
        country_name = str(country_name).upper()
        if len(country_name) != 2:
            raise ParserException("Only ISO 3166-1 alpha-2 codes are supported", 400)

        try:
            return countries.get(country_name).alpha2
        except KeyError:
            raise ParserException(f"Country {country_name} not found", 400)

    @staticmethod
    def parse_billing_address(billing_address):
        """
        Parse billing address dict
        """
        if 'countryCode' not in billing_address:
            raise ParserException('Billing address must have countryCode', 400)

        Parser.parse_country_code(billing_address['countryCode'])

        return billing_address

    @staticmethod
    def parse_currency(currency):
        """
        Helper function to parse currency code
        """
        currency = str(currency)  # to avoid errors when invalid currency type is passed
        try:
            Currency(currency.upper())
        except ValueError:
            raise ParserException('Not a valid Currency', 400)

        try:
            if(not(re.match(r'^[A-Z]{3}$', currency))):
                raise ParserException(
                    "Currency should be in ISO4217 format",
                    400)
            return currency

        except TypeError as e:
            raise ParserException("Currency should be a string", 400) from e

    @staticmethod
    def parse_amount(amount):
        """
        Helper function to parse amount
        """
        try:
            # Attempt conversion to Decimal (as string)
            d = Decimal(str(amount))

        except Exception as e:
            raise ParserException("Amount format is not decimal [%s]" % str(amount), 400) from e

        # Double check for special values
        if not d.is_normal():
            raise ParserException("Decimal special values not supported [%s]" % str(d), 400)
        if d.is_signed():
            raise ParserException("Negative amounts are not supported [%s]" % str(d), 400)

        return d

    @staticmethod
    def parse_orgid(orgid):
        """
        Helper function to parse an ORG.ID
        """
        r = r'^(did:orgid:([0-9]+:)?)?(?P<orgid>0x[0-9A-Fa-f]{64})$'

        # Parse the structure
        try:
            m = re.match(r, orgid)
            if(not(m)):
                raise ParserException(
                    "ORG.ID format is invalid" + " %s" % orgid,
                    400)
            return m.group('orgid')

        except Exception as e:
            raise ParserException(
                "ORG.ID format is invalid",
                400) from e

    @staticmethod
    def parse_agent(agent):
        """
        Helper function to parse an agent key
        """
        try:
            # Try to match either the DID public key or Ethereum address format
            m_did = re.match(
                r'^did:orgid:([0-9]{0,}:)?0x[0-9A-Za-z]{40}([0-9A-Za-z]{24})?(#.+)?$',
                agent
            )
            m_eth = re.match(
                r'^0x[0-9A-Za-z]{40}$',
                agent
            )
            if(m_did or m_eth):
                return agent

        except Exception:
            pass

        # Otherwise raise an exception
        raise ParserException(
            "Agent format is invalid",
            400)

    @staticmethod
    def parse_integer(integer):
        """
        Helper function to parse an integer
        """
        try:
            # Attempt conversion to integer (as string)
            i = int(str(integer))

        except Exception as e:
            raise ParserException("Format is not integer", 400) from e

        if i > 0:
            return i
        else:
            raise ParserException(
                "Integer must be greater than zero",
                400)

    @staticmethod
    def parse_expiration(expiration):
        """
        Helper function to parse an expiration date in UTC
        """
        try:
            expiration_datetime = dateutil.parser.isoparse(expiration)

        except Exception as e:
            raise ParserException(
                "Unsupported Expiration datetime",
                400) from e

        if(datetime.now(timezone.utc) < expiration_datetime):
            return expiration_datetime.astimezone(timezone.utc)

        else:
            raise ParserException(
                "Expiration datetime is in the past",
                400)

    @staticmethod
    def parse_uuid(uuid_string):
        """
        Helper function to parse a UUID
        """
        try:
            return str(uuid.UUID(uuid_string))
        except ValueError as e:
            raise ParserException(
                "UUID Field format is incorrect",
                400) from e

    @staticmethod
    def parse_month(month):
        """
        Check a month
        """
        try:
            if(not(re.match(r'^[0-9]{2}$', month))):
                raise ParserException(
                    "Month format should be numeric",
                    400)
            if (int(month) < 1) or (int(month) > 12):
                raise ParserException(
                    "Month should be between 01 and 12",
                    400)

            return month

        except TypeError as e:
            raise ParserException(
                "Month should be a string",
                400) from e

    @staticmethod
    def parse_year(year):
        """
        Check a year
        """
        try:
            if(not(re.match(r'^2[0-9]{3}$', year))):
                raise ParserException(
                    "Year format should be numeric in the 2XXX range",
                    400)
            return year

        except TypeError as e:
            raise ParserException(
                "year should be a string",
                400) from e

    @staticmethod
    def parse_cardholder_name(cardholder_name):
        """
        Check a cardholder name
        """
        try:
            if(not(re.match(r'^[-a-zA-Z\' ]{2,64}$', cardholder_name))):
                raise ParserException(
                    "Invalid cardholder name, non-standard latin charaters detected",
                    400)
            return cardholder_name

        except TypeError as e:
            raise ParserException(
                "cardholder name should be a string",
                400) from e

    @staticmethod
    def parse_iban(iban):
        """
        Check an IBAN validity
        Simplified version of https://en.wikipedia.org/wiki/International_Bank_Account_Number
        """
        try:
            if(not(re.match(r'^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$', iban))):
                raise ParserException(
                    "IBAN format is incorrect",
                    400)
            return iban

        except TypeError as e:
            raise ParserException(
                "IBAN should be a string",
                400) from e

    @staticmethod
    def parse_abartn(abartn):
        """
        Check an ACH Routing number
        """
        try:
            if(not(re.match(r'^[0-9]{9}$', abartn))):
                raise ParserException(
                    "ACH Routing number format is incorrect",
                    400)
            return abartn

        except TypeError as e:
            raise ParserException(
                "ACH Routing number should be a string",
                400) from e

    @staticmethod
    def parse_aba_account_number(account_number):
        """
        Check an account number
        """
        try:
            if(not(re.match(r'^[0-9]+$', account_number))):
                raise ParserException(
                    "Account number format is incorrect",
                    400)
            return account_number

        except TypeError as e:
            raise ParserException(
                "Account number should be a string",
                400) from e

    @staticmethod
    def parse_account_type(account_type):
        """
        Check an account type
        """
        try:
            if(not(re.match(r'^(CHECKING|SAVINGS)$', account_type))):
                raise ParserException(
                    "Account type format is incorrect",
                    400)
            return account_type

        except TypeError as e:
            raise ParserException(
                "Account type should be a string",
                400) from e

    @staticmethod
    def parse_instrument(instrument):
        """
        Check an instrument
        """
        if instrument != 'blockchain':
            raise ParserException(
                "Instrument not supported",
                400)
        return instrument

    @staticmethod
    def parse_chain(chain):
        """
        Check a chain
        """
        if chain != 'ethereum':
            raise ParserException(
                "Chain not supported",
                400)
        return chain

    @staticmethod
    def parse_transaction_hash(transaction_hash):
        """
        Check a transaction hash
        """
        try:
            if(not(re.match(r'^(0[xX])?[a-zA-Z0-9]{64}$', transaction_hash))):
                raise ParserException(
                    "Transaction hash is invalid",
                    400)
            if len(transaction_hash) == 64:
                transaction_hash = '0x' + transaction_hash
            return transaction_hash.lower()

        except TypeError as e:
            raise ParserException(
                "Transaction hash should be a string",
                400) from e

    @staticmethod
    def parse_did_into_elements(did):
        """
        Helper function to parse an ORG.ID and split that into elements
        Returns [chain,orgid,agentkey]
        """
        r = r'^did:orgid(:(?P<chain>[0-9]+))?:(?P<orgid>0x[0-9A-Fa-f]{64})(#(?P<agentkey>.+$))?'

        # Parse the structure
        try:
            m = re.match(r, did)
            if(not(m)):
                raise ParserException(
                    "ORG.ID format is invalid" + " %s" % did,
                    400)
            return m.group('chain'),m.group('orgid'),m.group('agentkey')

        except Exception as e:
            raise ParserException(
                "ORG.ID format is invalid",
                400) from e

