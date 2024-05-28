from decimal import Decimal
import unittest
from simard.token_manager import TokenManager, TokenManagerException
from simard.token_manager import payment_method_to_brand, get_token_data
from simard.travel_component import TravelComponent, TravelComponentException
from simard.db import db
import mongomock
from unittest import mock
import uuid


PCIPROXY_API_SERVICES_URL = 'http://localhost/pci_proxy_url'
PCIPROXY_API_PASSWORD = 'MyPassword'
PCIPROXY_API_USERNAME = 'MyUserName'

@mock.patch("simard.amex.PCIPROXY_API_SERVICES_URL", PCIPROXY_API_SERVICES_URL)
@mock.patch("simard.amex.PCIPROXY_API_PASSWORD", PCIPROXY_API_PASSWORD)
@mock.patch("simard.amex.PCIPROXY_API_USERNAME", PCIPROXY_API_USERNAME)
@mock.patch("simard.token_manager.PCIPROXY_API_SERVICES_URL", PCIPROXY_API_SERVICES_URL)
@mock.patch("simard.token_manager.PCIPROXY_API_PASSWORD", PCIPROXY_API_PASSWORD)
@mock.patch("simard.token_manager.PCIPROXY_API_USERNAME", PCIPROXY_API_USERNAME)
class TestTokenManager(unittest.TestCase):
    def setUp(self):
        db._database = mongomock.MongoClient().unittest
        self.orgid1 = '0x0000000000000000000000000000000000000000000000000000000000001121'
        self.orgid2 = '0x0000000000000000000000000000000000000000000000000000000000001122'
        self.orgid3 = '0x0000000000000000000000000000000000000000000000000000000000001123'
        self.agent = 'did:orgid:%s#secondkey' % self.orgid1

        self.token_data = {
            'currency': 'USD',
            'amount': '1500.00',
            'aliasCC': 'AAABfVjQPk7ssdexyrAAAYUeu5CnAAIg',
            'aliasCVV': '_sUDBqNgQG-MS7dPpvB4yb4U',
            'maskedCard': '370000XXXXX0002',
            'fingerprint': 'F-e8TXSdGHroKqrwgH9KFtH0',
            'paymentMethod': 'VIS',
            'expiryMonth': '03',
            'expiryYear': '2030',
            'cardInfo': {
                'brand': 'visa',
                'type': 'VISA CREDIT',
                'usage': 'consumer',
                'country': 'GB',
                'issuer': 'DATATRANS',
                'cardholderName': 'JOHN DAVID'
            },
            'billingAddress': {
                'countryCode': 'US',
                'stateProv': 'FL',
                'postalCode': '33160',
                'street': '123 STREET Billing',
                'cityName': 'Miami'
            },
        }

        self.travel_account_token_data = {
            'currency': 'USD',
            'amount': '12500.3452',
            'aliasCC': 'AAABfVjQPk7ssdexyrAAAYUeu5CnAAIg',
            'aliasCVV': '_sUDBqNgQG-MS7dPpvB4yb4U',
            'maskedCard': '370000XXXXX0002',
            'expiryMonth': '03',
            'expiryYear': '2030',
            'cardInfo': {
                'brand': 'amex',
                'type': 'debit',
                'cardholderName': 'DAVE DOE'
            },
            'billingAddress': {
                'countryCode': 'US',
                'stateProv': 'FL',
                'postalCode': '33160',
                'street': '123 STREET Billing',
                'cityName': 'Miami'
            },
            'customerReferences': {
                'costCenter': 'ABCDE-4',
                'projectCode': 'ABCDE-4',
                'employeeId': 'ABCDE-4',
                'travellerLastName': 'BONNY',
                'travellerFirstName': 'John'
            }
        }

        # travel components data
        self.air_component_data = {
            "componentType": "air",
            "recordLocator": "ZU7CKB",
            "documentType": "TKT",
            "documentNumber": "00147568054247",
            "documentIssuanceDate": "2021-12-01",
            "segments": [
                {
                    "iataCode": "BA",
                    "flightNumber": "1234",
                    "serviceClass": "C",
                    "origin": "LHR",
                    "destination": "JFK",
                    "departureTime": "2021-04-12T11:20:50.52Z",
                    "arrivalTime": "2021-04-12T23:20:50.52Z"
                }
            ],
            'amounts': {
                'total': '123.45'
            }
        }

        self.hotel_component_data = {
            "componentType": "hotel",
            "folioNumber": "BK2021061823",
            "checkInDate": "2021-04-12",
            "checkOutDate": "2021-04-13",
            "roomRates": [
                {
                    "dayRateAmount": "12500.00",
                    "nightCount": 1
                }
            ],
            'amounts': {
                'total': '123.45'
            }
        }

        self.travel_components_data = [
            self.air_component_data,
            self.hotel_component_data
        ]

        self.invalid_travel_components_data = [
            # invalid hotel component
            [{**self.hotel_component_data, 'componentType': 'not_supported'}],
            [{**self.hotel_component_data, 'folioNumber': 'lowercase'}],
            [{**self.hotel_component_data, 'checkInDate': '2022-2-01'}],
            [{**self.hotel_component_data, 'checkOutDate': '232894328932'}],
            [{**self.hotel_component_data, 'roomRates': [
                {**self.hotel_component_data['roomRates'][0], 'nightCount': 'not_supported'}
            ]}],
            [{**self.hotel_component_data, 'roomRates': [
                {**self.hotel_component_data['roomRates'][0], 'dayRateAmount': '12.4r3'}
            ]}],

            # invalid air component
            [{**self.air_component_data, 'componentType': 'not_supported'}],
            [{**self.air_component_data, 'documentType': 'notInEnum'}],
            [{**self.air_component_data, 'recordLocator': 'FOUR'}],
            [{**self.air_component_data, 'documentNumber': 'notNumbers'}],
            [{**self.air_component_data, 'documentIssuanceDate': 'invalid-date'}],
            [{**self.air_component_data, 'segments': [
                {**self.air_component_data['segments'][0], 'iataCode': 'notInEnum'},
            ]}],
            [{**self.air_component_data, 'segments': [
                {**self.air_component_data['segments'][0], 'flightNumber': 'notNumber'},
            ]}],
            [{**self.air_component_data, 'segments': [
                {**self.air_component_data['segments'][0], 'serviceClass': 'ABCDE'},
            ]}],
            [{**self.air_component_data, 'segments': [
                {**self.air_component_data['segments'][0], 'origin': 'FOUR'},
            ]}],
            [{**self.air_component_data, 'segments': [
                {**self.air_component_data['segments'][0], 'destination': 'FOUR'},
            ]}],
            [{**self.air_component_data, 'segments': [
                {**self.air_component_data['segments'][0], 'departureTime': '324432'},
            ]}],
            [{**self.air_component_data, 'segments': [
                {**self.air_component_data['segments'][0], 'arrivalTime': 'invalid-date'}
            ]}]
        ]

    def test_payment_method_to_brand(self):
        """
        Test the payment method brand mapping
        """
        method_to_brand_map = {
            'VIS': 'visa',
            'ECA': 'mastercard',
            'AMX': 'amex',
            'DIN': 'diners',
            'DIS': 'discover',
            'JCB': 'jcb',
            'CUP': 'unionpay',
        }

        for payment_method, brand in method_to_brand_map.items():
            self.assertEqual(method_to_brand_map[payment_method], brand)

        with self.assertRaises(TokenManagerException) as e:
            payment_method_to_brand('')
            self.assertEqual(e.code, 400)

        with self.assertRaises(TokenManagerException) as e:
            payment_method_to_brand(1234)
            self.assertEqual(e.code, 400)

        with self.assertRaises(TokenManagerException) as e:
            payment_method_to_brand('abcd')
            self.assertEqual(e.code, 400)

    @mock.patch('requests.get')
    def test_get_token_data_success(self, mock_get):
        """
        Test we can get token data
        """
        secure_field_transaction_id = 210701131818777802
        mock_get.return_value.json.return_value = self.token_data
        mock_get.return_value.status_code = 200

        self.assertDictEqual(
            get_token_data(secure_field_transaction_id),
            self.token_data
        )

        mock_get.assert_called_once_with(
            PCIPROXY_API_SERVICES_URL + '/inline/token',
            params={
                'transactionId': secure_field_transaction_id,
                'returnPaymentMethod': True,
                'returnCardInfo': True,
            },
            auth=(PCIPROXY_API_USERNAME, PCIPROXY_API_PASSWORD)
        )

    @mock.patch('requests.get')
    def test_get_token_data_notfound(self, mock_get):
        """
        Test we handle the exception when token data is not found
        """
        secure_field_transaction_id = 210701131818777803
        mock_get.return_value.text = 'Tokenization not found'
        mock_get.return_value.status_code = 400

        with self.assertRaises(TokenManagerException) as e:
            get_token_data(secure_field_transaction_id)
            self.assertEqual(e.code, 404)

    @mock.patch('requests.get')
    def test_get_token_data_expired(self, mock_get):
        """
        Test we handle the exception when token data is not found
        """
        secure_field_transaction_id = 210701131818777803
        mock_get.return_value.text = 'Tokenization expired'
        mock_get.return_value.status_code = 400

        with self.assertRaises(TokenManagerException) as e:
            get_token_data(secure_field_transaction_id)
            self.assertEqual(e.code, 400)

    @mock.patch('requests.get')
    def test_get_token_data_default_error(self, mock_get):
        """
        Test we handle the exception when an unexpected error is returned
        """
        secure_field_transaction_id = 210701131818777803
        mock_get.return_value.text = 'Server Error'
        mock_get.return_value.status_code = 500

        with self.assertRaises(TokenManagerException) as e:
            get_token_data(secure_field_transaction_id)
            self.assertEqual(e.code, 502)

    @mock.patch('requests.get')
    def test_create_token_success(self, mock_get):
        """
        Test creating a card guarantee
        """
        # Prepare the mock data
        secure_field_transaction_id = 210701131818777802
        mock_get.return_value.json.return_value = self.token_data
        mock_get.return_value.status_code = 200

        # Create the guarantee
        token = TokenManager.create_token(
            creator_orgid=self.orgid1,
            receiver_orgid=self.orgid2,
            agent=self.agent,
            secure_field_transaction_id=secure_field_transaction_id,
            expiry_month=self.token_data['expiryMonth'],
            expiry_year=self.token_data['expiryYear'],
            cardholder_name=self.token_data['cardInfo']['cardholderName'],
            billing_address_dict=self.token_data['billingAddress'],
        )

        # Verify the guarantee
        self.assert_equal_token_values(token, self.token_data)

    @mock.patch('requests.get')
    def test_retrieve_token(self, mock_get):
        """
        Test retrieving a card guarantee
        """
        # Prepare the mock data
        secure_field_transaction_id = 210701131818777802
        mock_get.return_value.json.return_value = self.token_data
        mock_get.return_value.status_code = 200

        # Create the guarantee
        token_uuid = TokenManager.create_token(
            creator_orgid=self.orgid1,
            receiver_orgid=self.orgid2,
            agent=self.agent,
            secure_field_transaction_id=secure_field_transaction_id,
            expiry_month=self.token_data['expiryMonth'],
            expiry_year=self.token_data['expiryYear'],
            cardholder_name=self.token_data['cardInfo']['cardholderName'],
            billing_address_dict=self.token_data['billingAddress'],
        ).uuid

        # Retrieve the guarantee
        token = TokenManager.retrieve_token(
            orgid=self.orgid1,
            agent=self.agent,
            token_uuid=token_uuid
        )

        # Verify the guarantee
        self.assert_equal_token_values(token, self.token_data, token_uuid)

        # Retrieve the card guarantee as the receiver
        token = TokenManager.retrieve_token(
            orgid=self.orgid2,
            agent=self.agent,
            token_uuid=token_uuid
        )
        self.assertEqual(token.uuid, token_uuid)

        # Verify the card guarantee can not be accessed by someone else
        with self.assertRaises(TokenManagerException) as e:
            TokenManager.retrieve_token(
                orgid=self.orgid3,
                agent=self.agent,
                token_uuid=token_uuid
            )
            self.assertEqual(e.code, 403)

        # Verify the card guarantee can not be accessed by someone else
        with self.assertRaises(TokenManagerException) as e:
            TokenManager.retrieve_token(
                orgid=self.orgid3,
                agent=self.agent,
                token_uuid=token_uuid
            )
            self.assertEqual(e.code, 403)

        # Verify random guarantees fail
        random_uuid = str(uuid.uuid4())
        with self.assertRaises(TokenManagerException) as e:
            TokenManager.retrieve_token(
                orgid=self.orgid1,
                agent=self.agent,
                token_uuid=random_uuid
            )
            self.assertEqual(e.code, 404)

    @mock.patch('requests.get')
    def test_delete_token(self, mock_get):
        """
        Test deleting a card guarantee
        """
        # Prepare the mock data
        secure_field_transaction_id = 210701131818777802
        mock_get.return_value.json.return_value = self.token_data
        mock_get.return_value.status_code = 200

        # Create the guarantee
        token_uuid = TokenManager.create_token(
            creator_orgid=self.orgid1,
            receiver_orgid=self.orgid2,
            agent=self.agent,
            secure_field_transaction_id=secure_field_transaction_id,
            expiry_month=self.token_data['expiryMonth'],
            expiry_year=self.token_data['expiryYear'],
            cardholder_name=self.token_data['cardInfo']['cardholderName'],
            billing_address_dict=self.token_data['billingAddress']
        ).uuid

        # Try deleting as a receiver
        with self.assertRaises(TokenManagerException) as e:
            TokenManager.delete_token(
                orgid=self.orgid2,
                agent=self.agent,
                token_uuid=token_uuid
            )
            self.assertEqual(e.code, 403)

        # Try deleting as a third party
        with self.assertRaises(TokenManagerException) as e:
            TokenManager.delete_token(
                orgid=self.orgid3,
                agent=self.agent,
                token_uuid=token_uuid
            )
            self.assertEqual(e.code, 403)

        # Try deleting a random reference
        random_uuid = str(uuid.uuid4())
        with self.assertRaises(TokenManagerException) as e:
            TokenManager.delete_token(
                orgid=self.orgid1,
                agent=self.agent,
                token_uuid=random_uuid
            )
            self.assertEqual(e.code, 404)

        # Delete the guarantee as the owner
        TokenManager.delete_token(
            orgid=self.orgid1,
            agent=self.agent,
            token_uuid=token_uuid
        )

        # Verify it can't be retrieved now
        with self.assertRaises(TokenManagerException) as e:
            TokenManager.retrieve_token(
                orgid=self.orgid1,
                agent=self.agent,
                token_uuid=token_uuid
            )
            self.assertEqual(e.code, 404)

    @mock.patch('requests.post')
    @mock.patch('requests.get')
    def test_create_travel_account_token_success(self, mock_get, mock_post):
        """
        Test creating a travel account token successfully
        """
        # prepare mock data
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = self.token_data
        mock_post.side_effect = [
            mock.Mock(status_code=200, json=mock.Mock(return_value=self.token_data)),
            mock.Mock(status_code=200, json=mock.Mock(return_value={'transactionId': '3443243'}))
        ]

        # Create the guarantee
        token = TokenManager.create_travel_account_token(
            creator_orgid=self.orgid1,
            receiver_orgid=self.orgid2,
            agent=self.agent,
            currency=self.travel_account_token_data['currency'],
            amount=self.travel_account_token_data['amount'],
            customer_references=self.travel_account_token_data['customerReferences']
        )

        # Verify the guarantee
        self.assert_equal_token_values(token, self.travel_account_token_data)

    @mock.patch('requests.post')
    def test_create_travel_account_token_invalid_currency(self, mock_post):
        """
        Test creating a travel account token with invalid currency
        """
        mock_post.side_effect = [
            mock.Mock(status_code=200, json=mock.Mock(return_value=self.token_data)),
            mock.Mock(status_code=200, json=mock.Mock(return_value={'transactionId': '3443243'}))
        ]

        # test invalid currency => handled by parser.py
        with self.assertRaises(Exception) as e:
            TokenManager.create_travel_account_token(
                creator_orgid=self.orgid1,
                receiver_orgid=self.orgid2,
                agent=self.agent,
                currency='FSD',  # invalid currency
                amount=self.travel_account_token_data['amount'],
                customer_references=self.travel_account_token_data['customerReferences']
            )
            self.assertEqual(e.code, 400)

    @mock.patch('requests.post')
    def test_create_travel_account_token_invalid_amount(self, mock_post):
        """
        Test creating a travel account token with invalid amount
        """
        mock_post.side_effect = [
            mock.Mock(status_code=200, json=mock.Mock(return_value=self.token_data)),
            mock.Mock(status_code=200, json=mock.Mock(return_value={'transactionId': '3443243'}))
        ]

        # test invalid amount => handled by parser.py
        with self.assertRaises(Exception) as e:
            TokenManager.create_travel_account_token(
                creator_orgid=self.orgid1,
                receiver_orgid=self.orgid2,
                agent=self.agent,
                currency=self.travel_account_token_data['currency'],
                amount='4339.t56',  # invalid amount
                customer_references=self.travel_account_token_data['customerReferences']
            )
            self.assertEqual(e.code, 400)

    def test_travel_components_success(self):
        """
        Test updating travel components in travel account token successfully
        """
        token_uuid = self.create_travel_account_token()

        # set the travel components
        travel_components = TokenManager.add_travel_components(
            orgid=self.orgid1,
            agent=self.agent,
            token_uuid=token_uuid,
            travel_components=self.travel_components_data
        )
        travel_components[0]['amounts']['total'] = str(travel_components[0]['amounts']['total'])
        travel_components[1]['amounts']['total'] = str(travel_components[1]['amounts']['total'])
        self.assertDictContainsSubset(self.travel_components_data[0], travel_components[0])
        self.assertDictContainsSubset(self.travel_components_data[1], travel_components[1])

        # get the travel components
        travel_components = TokenManager.get_travel_components(
            orgid=self.orgid1,
            agent=self.agent,
            token_uuid=token_uuid
        )
        travel_components[0]['amounts']['total'] = str(travel_components[0]['amounts']['total'])
        travel_components[1]['amounts']['total'] = str(travel_components[1]['amounts']['total'])
        self.assertDictContainsSubset(self.travel_components_data[0], travel_components[0])
        self.assertDictContainsSubset(self.travel_components_data[1], travel_components[1])

    @mock.patch('requests.post')
    @mock.patch('requests.get')
    def test_travel_components_notfound(self, mock_post, mock_get):
        """
        Test updating travel components in travel account token that is not found
        """
        # prepare mock data
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = self.token_data
        mock_post.side_effect = [
            mock.Mock(status_code=200, json=mock.Mock(return_value=self.token_data)),
            mock.Mock(status_code=200, json=mock.Mock(return_value={'transactionId': '3443243'}))
        ]

        random_uuid = str(uuid.uuid4())

        # test updating travel_components for invalid token
        with self.assertRaises(TokenManagerException) as e:
            TokenManager.add_travel_components(
                orgid=self.orgid1,
                agent=self.agent,
                token_uuid=random_uuid,
                travel_components=self.travel_components_data
            )
            self.assertEqual(e.code, 404)

        # test getting travel_components for invalid token
        with self.assertRaises(TokenManagerException) as e:
            TokenManager.get_travel_components(
                orgid=self.orgid1,
                agent=self.agent,
                token_uuid=random_uuid
            )
            self.assertEqual(e.code, 404)

    def test_travel_components_invalid_samples(self):
        """
        Test updating travel components in travel account token with invalid input
        """
        token_uuid = self.create_travel_account_token()

        invalid_data = self.invalid_travel_components_data[0]
        for invalid_data in self.invalid_travel_components_data:

            # test updating travel_components with invalid data
            try:
                with self.assertRaises(TokenManagerException) as e:
                    TokenManager.add_travel_components(
                        orgid=self.orgid1,
                        agent=self.agent,
                        token_uuid=token_uuid,
                        travel_components=invalid_data
                    )
                    self.assertEqual(e.code, 400)
            except TravelComponentException as e:
                self.assertEqual(e.code, 400)

    @mock.patch('requests.post')
    @mock.patch('requests.get')
    def create_travel_account_token(self, mock_get, mock_post):
        """
        Create a travel account token
        """
        # prepare mock data
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = self.token_data
        mock_post.side_effect = [
            mock.Mock(status_code=200, json=mock.Mock(return_value=self.token_data)),
            mock.Mock(status_code=200, json=mock.Mock(return_value={'transactionId': '3443243'}))
        ]

        # Create the token
        token_uuid = TokenManager.create_travel_account_token(
            creator_orgid=self.orgid1,
            receiver_orgid=self.orgid2,
            agent=self.agent,
            currency=self.travel_account_token_data['currency'],
            amount=self.travel_account_token_data['amount'],
            customer_references=self.travel_account_token_data['customerReferences']
        ).uuid

        return token_uuid

    def assert_equal_token_values(self, token, expected, token_uuid=None):
        if token_uuid:
            self.assertEqual(token.uuid, token_uuid)

        self.assertEqual(token.creator, self.orgid1)
        self.assertEqual(token.receiver, self.orgid2)
        self.assertEqual(token.agent, self.agent)

        self.assertEqual(token.card_data.alias_cc, expected['aliasCC'])
        self.assertEqual(token.card_data.alias_cvv, expected['aliasCVV'])
        self.assertEqual(token.card_data.masked_card, expected['maskedCard'].upper())
        self.assertEqual(token.card_data.expiry_month, expected['expiryMonth'])
        self.assertEqual(token.card_data.expiry_year, expected['expiryYear'])

        self.assertEqual(token.card_data.brand, expected['cardInfo']['brand'])
        self.assertEqual(token.card_data.card_type, expected['cardInfo']['type'])
        self.assertEqual(token.card_data.cardholder_name, expected['cardInfo']['cardholderName'])

        self.assertEqual(token.billing_address.country_code, expected['billingAddress']['countryCode'])
        self.assertEqual(token.billing_address.state_prov, expected['billingAddress']['stateProv'])
        self.assertEqual(token.billing_address.postal_code, expected['billingAddress']['postalCode'])
        self.assertEqual(token.billing_address.city_name, expected['billingAddress']['cityName'])
        self.assertEqual(token.billing_address.street, expected['billingAddress']['street'])
