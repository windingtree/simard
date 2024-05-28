# libraries
import json
import hmac
import base64
import logging
from dataclasses import dataclass
from typing import List

import requests
import datetime
from pytz import timezone
from uuid import uuid4
from hashlib import md5, sha256
from iso4217 import Currency
from decimal import Decimal, ROUND_UP
from model import CustomerReferences
# inner modules
from model.exception import SimardException
from simard.air_component import AirComponent, AirSegment
from simard.datatrans_tokenizer import DataTransTokenizer, CardNumberAndCVV, DataTransTokenizerException

from simard.settings import (
    PCIPROXY_API_SERVICES_URL,
    PCIPROXY_API_PULL_URL,
    PCIPROXY_API_TOKENIZE_URL,
    PCIPROXY_API_TOKEN,
    PCIPROXY_API_USERNAME,
    PCIPROXY_API_PASSWORD,
    AMEX_HOST,
    AMEX_PORT,
    AMEX_SMART_TOKENS_ENDPOINT,
    AMEX_CLIENT_ID,
    AMEX_CLIENT_SECRET,
    AMEX_BILLING_ACCOUNT_ID,
    OVERRIDE_AMEX_TOKEN, AMEX_SKIP_PCIPROXY
)
from simard.token import Token, CardData
from simard.travel_component import TravelComponent


class AmexException(SimardException):
    pass


@dataclass
class AmexReconciliationFields:
    """Fields used for reconciliation"""

    user1: str = None
    user2: str = None
    user3: str = None
    user4: str = None
    user5: str = None
    user6: str = None
    user7: str = None
    user8: str = None
    user9: str = None
    user10: str = None
    user11: str = None
    user12: str = None
    accounting1: str = None
    accounting2: str = None
    accounting3: str = None
    accounting4: str = None
    accounting5: str = None
    accounting6: str = None
    accounting7: str = None
    accounting8: str = None

    def to_dict(self):
        response = {
            "user_defined_fields_group": [],
            "accounting_fields_group": []
        }
        # iterate all the fields, if it's not None, append it to the response
        for i in range(1, 13):
            if getattr(self, f"user{i}") is not None:
                response['user_defined_fields_group'].append({"index": f"{i}", "value": getattr(self, f"user{i}")})

        for i in range(1, 9):
            if getattr(self, f"accounting{i}") is not None:
                response['accounting_fields_group'].append({"index": f"{i}", "value": getattr(self, f"accounting{i}")})

        return response

    @staticmethod
    def build_reconciliation_fields(travel_components: List[TravelComponent],
                                    customer_references: CustomerReferences = None):
        """
        Build reconciliation fields from customer references(optional) and travel components (optional)
        """
        fields = AmexReconciliationFields()
        if customer_references:
            if customer_references.project_code:
                fields.user5 = customer_references.project_code
            if customer_references.employee_id:
                fields.user6 = customer_references.employee_id
            if customer_references.traveller_type:
                fields.user7 = customer_references.traveller_type
            if customer_references.approver_last_name:
                fields.user8 = customer_references.approver_last_name

            if customer_references.traveller_last_name:
                fields.accounting1 = customer_references.traveller_last_name
            if customer_references.traveller_first_name:
                fields.accounting2 = customer_references.traveller_first_name

        if travel_components and len(travel_components) > 0:
            contact_email = ''
            dept_date = ''
            origin = ''

            if type(travel_components[0]) is AirComponent:
                first_component: AirComponent = travel_components[0]
                fields.user3 = first_component.record_locator
                fields.accounting4 = 'air'
                fields.accounting6 = first_component.document_number

                if first_component.contact_email:
                    fields.user1 = first_component.contact_email

                if first_component.segments and len(first_component.segments) > 0:
                    first_segment: AirSegment = first_component.segments[0]
                    fields.accounting5 = AmexReconciliationFields._determine_itinerary_destination(first_component.segments)
                    fields.user4 = first_segment.departure_time[0:10]

        return fields

    @staticmethod
    def _determine_itinerary_destination(segments: List[AirSegment]) -> str:
        """From a list of segments, determine the destination of the itinerary"""
        if not segments or len(segments) == 0:
            return ''

        if segments[0].origin == segments[-1].destination:
            # round trip flight - find the longest duration of stay at destination
            longest_stay = datetime.timedelta(0)
            longest_stay_destination = ''
            for idx, segment in enumerate(segments):
                if idx == 0:
                    continue

                arrival = datetime.datetime.strptime(segments[idx - 1].arrival_time, '%Y-%m-%dT%H:%M:%S.%fZ')
                departure = datetime.datetime.strptime(segments[idx].departure_time, '%Y-%m-%dT%H:%M:%S.%fZ')
                stay_duration = departure - arrival
                if stay_duration > longest_stay:
                    longest_stay = stay_duration
                    longest_stay_destination = segments[idx - 1].destination

            return longest_stay_destination
        else:
            # one way flight
            return segments[-1].destination

        return ''


class Amex(object):

    @staticmethod
    def format_amount_to_amex_type(amount: Decimal, currency: Currency) -> str:
        """
        Format amount to the type that Amex accepts
        eg. from '1500.34' to '150034'
        """
        decimal_places = currency.exponent
        amount_in_lower_decimal_units = amount * Decimal(10) ** decimal_places
        amount = str(amount_in_lower_decimal_units.to_integral_value(rounding=ROUND_UP))

        return amount

    @staticmethod
    def add_decimal_point(amount: Decimal, currency: Currency) -> str:
        """
        Add decimal point to the amount
        eg. from '150034' to '1500.34'
        """
        decimal_places = currency.exponent
        if decimal_places > 0:
            amount = str(amount)[:-decimal_places] + '.' + str(amount)[-decimal_places:]

        return str(amount)

    @staticmethod
    def b64_hmac(key, to_sign):
        """
        Create a base64 encoded SHA-256 digest using the client key
        """
        h = hmac.new(key.encode('UTF-8'), digestmod=sha256)
        h.update(to_sign.encode('UTF-8'))
        hash_digest = h.digest()
        b64hash = base64.b64encode(hash_digest).decode()

        return b64hash

    @staticmethod
    def generate_amex_hmac(
            method,
            host,
            port,
            path,
            raw_body,
            nonce,
            client_id,
            client_secret
    ):
        """
        Used to generate the amex header authorization
        """

        body_hash = Amex.b64_hmac(client_secret, raw_body)

        # Timestamp in Unix Epoch format in ms.
        ts = str(int(datetime.datetime.now().timestamp() * 1000))

        # The following order is critical.
        base_string = "\n".join([
            ts, str(nonce), method, path, host, str(port), body_hash
        ]) + "\n"

        mac = Amex.b64_hmac(client_secret, base_string)

        result_format = '="%s",'.join(["MAC id", "ts", "nonce", "bodyhash", "mac"]) + '="%s"'
        result = result_format % (client_id, ts, nonce, body_hash, mac)
        return result

    @staticmethod
    def generate_nonce():
        return str(uuid4())

    @staticmethod
    def generate_token_reference_id():
        """Generate unique token reference id using uuid4 with removed hyphens to get 14 characters (max allowed)"""
        return str(uuid4()).replace("-", "")[0:14]

    @staticmethod
    def create_travel_account(
            amount,
            currency,
            cost_center: None,
            customer_references: CustomerReferences = None,
    ):
        """ Creates an AMEX smart token authorized for maximum amount(and currency), valid for 3 days.
        If customer_references are provided, they will be added to the token (as per agreement with EY)
        """
        # Generating a start and end date in the following format => YYYYMMDD
        now_in_amex_timezone = datetime.datetime.now(timezone("MST"))
        token_start_date = now_in_amex_timezone.date().strftime("%Y%m%d")
        token_end_date = now_in_amex_timezone + datetime.timedelta(days=2)
        token_end_date = token_end_date.strftime("%Y%m%d")
        token_reference_id = Amex.generate_token_reference_id()
        amount = Amex.format_amount_to_amex_type(amount, currency)

        amex_data = {
            "token_issuance_params": {
                "billing_account_id": AMEX_BILLING_ACCOUNT_ID,
                "maintained_by": "User",
                "supplier_token_ind": "N",
                "token_details": {
                    "token_reference_id": token_reference_id,
                    "token_amount": amount,
                    "token_start_date": token_start_date,
                    "token_end_date": token_end_date
                },
                "reconciliation_fields":
                    AmexReconciliationFields
                    .build_reconciliation_fields([], customer_references)
                    .to_dict()
            }
        }

        # Execute request
        res = Amex.smart_token_request(amex_data, "POST")

        # production mode
        token_number = res['token_issuance_data']['token_details']['token_number']
        if token_number.isdigit() and int(token_number) == 0:
            if not OVERRIDE_AMEX_TOKEN:
                raise AmexException(
                    'Invalid American Express smart token',
                    502
                )
        token_details = res['token_issuance_data']['token_details']
        token_expiry_date = datetime.datetime.strptime(token_details['token_expiry_date'], '%Y%m')
        token_expiry_date = token_expiry_date.strftime('%m/%Y')
        token_data = {
            # "aliasCC": token_details['token_number'],
            "cc": token_details['token_number'],
            "fingerprint": '',  # token_details['fingerprint'],
            # "aliasCVV": token_details['token_security_code'],
            "cvv": token_details['token_security_code'],
            # "maskedCard": token_details['token_number'],  # this should be masked number
            'paymentMethod': 'AMX',
            "expiry": token_expiry_date,
        }
        cvv=token_data['cvv']
        cc=token_data['cc']
        expiry=token_data['expiry']
        payment_method=token_data['paymentMethod']
        # sometimes we need to use test cards (e.g. in test airline environments)
        # we can override card generated by amex with a 'static test card' by using specific cost_center value
        costcenter_to_test_card_map = {
            "TESTAMEXAA": {
                "cardNumber": "4035501000000008",
                "cvv": "737",
                "expiry": "03/2030",
                'paymentMethod': 'VIS',
            },
            "TESTAMEXUA": {
                "cardNumber": "345678000000007",
                "cvv": "1234",
                "expiry": "01/2039",
                "paymentMethod": "AMX",
            },
            "TESTAMEXFLX": {
                "cardNumber": "345678000000007",
                "cvv": "1234",
                "expiry": "01/2039",
                'paymentMethod': 'AMX',
            }
        }
        if cost_center in costcenter_to_test_card_map.keys():
            print(f'Overriding card data due to usage of a test cost center:{cost_center}')
            cc = costcenter_to_test_card_map[cost_center]['cardNumber']
            cvv = costcenter_to_test_card_map[cost_center]['cvv']
            expiry = costcenter_to_test_card_map[cost_center]['expiry']
            payment_method = costcenter_to_test_card_map[cost_center]['paymentMethod']
        try:
            to_tokenize = CardNumberAndCVV(cc=cc, cvv=cvv)
            tokenized = DataTransTokenizer.tokenize_card(to_tokenize)
            token_data['maskedCard'] = tokenized.masked_number
            token_data['aliasCC'] = tokenized.cc_alias
            token_data['aliasCVV'] = tokenized.cvv_alias
            token_data['expiry'] = expiry
            token_data['paymentMethod'] = payment_method
        except Exception as e:
            raise AmexException('Unable to tokenize card',502)
        # if AMEX_SKIP_PCIPROXY:
            #if we skipped PCIPROXY, we should not return maskedCard (ndc-proxy uses that field to recognize if it should use pci-proxy or not)
            # del token_data['maskedCard']

        # override token data for testing, store AMEX token details in db for later use (only in test mode
        # if OVERRIDE_AMEX_TOKEN:
        #     overriden_card_data = Amex._tokenize_card(cost_center)
        #     overriden_card_data['amount'] = Amex.add_decimal_point(amount, currency)
        #     # return overriden_card_data together with amex token details
        #     # amex token details is needed in test mode to later update it with post booking data (pnr, eTicket, etc..)
        #     return overriden_card_data, token_data

        return token_data, None

    @staticmethod
    def _tokenize_card(cost_center):
        # STEP-1. Hardcoded card-data based on each costCenter
        cards_data = {
            "TESTAMEXAA": {
                "cardNumber": "4035501000000008",
                "cvv": "737",
                "expiry": "03/2030",
                'paymentMethod': 'VIS',
            },
            "TESTAMEXUA": {
                "cardNumber": "345678000000007",
                "cvv": "1234",
                "expiry": "01/2039",
                "paymentMethod": "AMX",
            },
            "TESTAMEXFLX": {
                "cardNumber": "345678000000007",
                "cvv": "1234",
                "expiry": "01/2039",
                'paymentMethod': 'AMX',
            }
        }
        # STEP-2 select the card
        if cost_center not in cards_data.keys():
            # pick the first card
            cost_center = list(cards_data.keys())[0]
        card_data = cards_data[cost_center]

        # STEP-3 Tokenize the card (if AMEX_SKIP_PCIPROXY=TRUE, otherwise just return the card data)
        if AMEX_SKIP_PCIPROXY:
            token_details = {
                "aliasCC": card_data['cardNumber'],
                "fingerprint": '',
                "aliasCVV": card_data['cvv'],
                #"maskedCard": Amex.mask_card_number(card_data['cardNumber']),
                "expiry": card_data['expiry'],
                'paymentMethod': card_data['paymentMethod'],
            }
        else:
            pci_tokenize_data = {
                'mode': 'TOKENIZE',
                'formId': '211119074243205950',
                'cardNumber': card_data['cardNumber'],
                'cvv': card_data['cvv'],
                'merchantId': PCIPROXY_API_USERNAME,
            }
            pci_tokenize_res = requests.post(
                url=PCIPROXY_API_TOKENIZE_URL,
                data=pci_tokenize_data
            )
            if pci_tokenize_res.status_code != 200:
                raise AmexException(
                    f'PCI Proxy API returned status code {pci_tokenize_res.status_code}',
                    502
                )
            transaction_id = pci_tokenize_res.json()['transactionId']
            # STEP-4 fetch the tokenized card
            token_data = requests.get(
                url=f'{PCIPROXY_API_SERVICES_URL}/inline/token?transactionId={transaction_id}',
                auth=(PCIPROXY_API_USERNAME, PCIPROXY_API_PASSWORD),
                headers={
                    'x-cc-merchant-id': PCIPROXY_API_USERNAME,
                    'pci-proxy-api-key': PCIPROXY_API_TOKEN,
                    'x-cc-url': PCIPROXY_API_SERVICES_URL + '/inline/token'
                }
            )
            if token_data.status_code != 200:
                raise AmexException(
                    f'PCI Proxy API returned status code {token_data.status_code}',
                    502
                )
            # STEP-5 Format data and move on
            response = token_data.json()
            token_details = {
                "aliasCC": response['aliasCC'],
                "fingerprint": response['fingerprint'],
                "aliasCVV": response['aliasCVV'],
                "maskedCard": response['maskedCard'],  # this should be masked number
                "expiry": card_data['expiry'],
                'paymentMethod': card_data['paymentMethod'],

            }
        return token_details

    @staticmethod
    def delete_travel_account(token_number: str):
        """Deletes AMEX token specified by token_number"""

        amex_data = {
            "billing_account_id": AMEX_BILLING_ACCOUNT_ID,
            "token_number": token_number,
        }

        Amex.smart_token_request(amex_data, "DELETE")

        return_data = {
            "status": "OK"
        }

        return return_data

    @staticmethod
    def update_travel_account_with_travel_components(token_number: str,
                                                     travel_components: List[TravelComponent] = None,
                                                     customer_references: CustomerReferences = None):
        """Updates AMEX token specified by token_number with
            - travel components (such as travel date, destination, eTicket, pnr locator) and
            - customer references (such as engagement code, approver last name, etc.)"""
        if not token_number:
            raise AmexException('Missing required parameter: token_number', 400)

        amex_data = {
            "token_identifier": {
                "token_number": token_number
            },
            "token_issuance_params": {
                "token_details": {
                },
                "reconciliation_fields":
                    AmexReconciliationFields
                    .build_reconciliation_fields(travel_components, customer_references)
                    .to_dict()
            }
        }

        Amex.smart_token_request(amex_data, "PUT")

        return_data = {
            "status": "OK"
        }
        return return_data

    @staticmethod
    def smart_token_request(payload, method: str):
        """Make a request to the Amex Smart Tokens API and send payload specified by payload parameter
            :param payload: The payload to send to the Amex Smart Tokens API
            :param method: The HTTP method to use for the request
                POST - create a token,
                PUT - update a token,
                DELETE - delete a token
        """

        if method not in ['POST', 'PUT', 'DELETE']:
            raise AmexException(f'Invalid HTTP method: {method}', 405)

        raw_body = json.dumps(payload)
        nonce = Amex.generate_nonce()
        auth_header = Amex.generate_amex_hmac(
            method,
            AMEX_HOST,
            AMEX_PORT,
            AMEX_SMART_TOKENS_ENDPOINT,
            raw_body,
            nonce,
            AMEX_CLIENT_ID,
            AMEX_CLIENT_SECRET
        )
        amex_endpoint = f'https://{AMEX_HOST}{AMEX_SMART_TOKENS_ENDPOINT}'
        # Create headers
        amex_headers = {
            'x-amex-api-key': AMEX_CLIENT_ID,
            'authorization': auth_header,
            'Content-Type': 'application/json'
        }
        pci_proxy_headers = {
            **amex_headers,
            'x-cc-merchant-id': PCIPROXY_API_USERNAME,
            'pci-proxy-api-key': PCIPROXY_API_TOKEN,
            'x-cc-url': amex_endpoint
        }
        # Execute request
        # if AMEX_SKIP_PCIPROXY:
        res = requests.request(
            method=method,
            url=amex_endpoint,
            data=raw_body,
            headers=amex_headers
        )
        # else:
        #     print(f"Call to PCI Proxy: {method} {PCIPROXY_API_PULL_URL} {raw_body}")
        #     res = requests.request(
        #         method=method,
        #         url=PCIPROXY_API_PULL_URL,
        #         data=raw_body,
        #         headers=pci_proxy_headers
        #     )
        if res.status_code != 200:
            # print(f"Request: {raw_body}")
            # print(f"Response: {res.status_code} {res.text}")
            if 'X-CC-ERROR' in res.headers.keys():
                raise AmexException(f'PCI Proxy API returned status code {res.status_code}', 502)
            else:
                # Amex fault
                raise AmexException('Invalid Amex smart token request', 502)
        # print(f"Response: {res.status_code} {res.text}")
        return res.json()

    @staticmethod
    def mask_card_number(card_number: str):
        """Masks the card number specified by card_number parameter"""
        if not card_number:
            return ''
        return "X" * (len(card_number)-4) + card_number[(len(card_number)-4):]
