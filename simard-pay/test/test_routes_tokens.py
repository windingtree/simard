from flask_testing import TestCase as FlaskTestCase
from simard import app
from unittest import mock
from simard.db import db
import mongomock
from model.exception import SimardException
from unittest import TestCase

PCIPROXY_API_SERVICES_URL = 'http://localhost/pci_proxy_url'
PCIPROXY_API_PASSWORD = 'MyPassword'
PCIPROXY_API_USERNAME = 'MyUserName'

@mock.patch("simard.amex.PCIPROXY_API_SERVICES_URL", PCIPROXY_API_SERVICES_URL)
@mock.patch("simard.amex.PCIPROXY_API_PASSWORD", PCIPROXY_API_PASSWORD)
@mock.patch("simard.amex.PCIPROXY_API_USERNAME", PCIPROXY_API_USERNAME)
@mock.patch("simard.token_manager.PCIPROXY_API_SERVICES_URL", PCIPROXY_API_SERVICES_URL)
@mock.patch("simard.token_manager.PCIPROXY_API_PASSWORD", PCIPROXY_API_PASSWORD)
@mock.patch("simard.token_manager.PCIPROXY_API_USERNAME", PCIPROXY_API_USERNAME)
class TokensRouteTest(FlaskTestCase, TestCase):
    def setUp(self):
        db._database = mongomock.MongoClient().unittest

        # JWT Token is fake since we mock the call to the token verification
        self.jwt = '<header>.<claim>.<signature>'
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer %s' % self.jwt
        }

        self.orgid = '0x0000000000000000000000000000000000000000000000000000000000001121'
        self.orgid2 = '0x0000000000000000000000000000000000000000000000000000000000001122'
        self.currency = "USD"
        self.amount = "12738.3939"
        self.formatted_amount = "12738.40"
        self.agent = 'did:orgid:%s#secondkey' % self.orgid
        self.secure_field_transaction_id = 210701131818777802
        self.token_data = {
            "aliasCC": "AAABfVjQPk7ssdexyrAAAYUeu5CnAAIg",
            "fingerprint": "F-cusd81-71tSxcumDNTjQyv",
            "aliasCVV": "_sUDBqNgQG-MS7dPpvB4yb4U",
            "paymentMethod": "VIS",
            "maskedCard": "370000xxxxx0002",
            "cardInfo": {
                "brand": "VISA CREDIT",
                "type": "debit",
                "usage": "consumer",
                "country": "GB",
                "issuer": "DATATRANS"
            }
        }
        self.expiry_month = '03'
        self.expiry_year = '2030'
        self.cardholder_name = 'DAVE DOE'
        self.billing_address_dict = {
            'countryCode': 'US',
            'stateProv': 'FL',
            'postalCode': '33160',
            'street': '123 STREET Billing',
            'cityName': 'Miami'
        }

        # travel components data
        self.travel_components_data = [
            {
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
                "amounts": {
                    "total": "123.45"
                }
            },
            {
                "componentType": "hotel",
                "folioNumber": "BK202087",
                "checkInDate": "2021-04-12",
                "checkOutDate": "2021-04-13",
                "roomRates": [
                    {
                        "dayRateAmount": "12500.00",
                        "nightCount": 1
                    }
                ],
                "amounts": {
                    "total": "456.78"
                }
            }
        ]

        # Mock the requests.get to avoid making external calls
        get_patcher = mock.patch('requests.get')
        self.mock_get = get_patcher.start()
        self.mock_get.return_value.text = '<PATCH ME>'
        self.mock_get.return_value.status_code = 200
        self.addCleanup(get_patcher.stop)

        # Mock the requests.post to avoid making external calls
        get_patcher = mock.patch('requests.post')
        self.mock_post = get_patcher.start()
        self.mock_post.return_value.text = '<PATCH ME>'
        self.mock_post.return_value.status_code = 200
        self.addCleanup(get_patcher.stop)

        # Mock the token to avoid making external calls
        patcher = mock.patch(
            'simard.oauth_manager.OAuthManager.validate_token',
            return_value=(self.orgid, self.agent)
        )
        self.mock_validate_token = patcher.start()
        self.addCleanup(patcher.stop)

        # A Patcher for the event handler
        event_handler_patcher = mock.patch('simard.event_handler.EventHandler.log_event')
        self.mock_event_handler = event_handler_patcher.start()
        self.addCleanup(event_handler_patcher.stop)

    # Create the app
    def create_app(self):
        app.config['TESTING'] = True
        return app

    def test_create_token_lifecycle(self):
        """
        Create a token
        """
        self.mock_get.return_value.json.return_value = self.token_data
        response = self.client.post(
            path='/api/v1/tokens',
            json={
                "receiverOrgId": self.orgid2,
                "secureFieldTransactionId": str(self.secure_field_transaction_id),
                "expiryMonth": self.expiry_month,
                "expiryYear": self.expiry_year,
                "cardholderName": self.cardholder_name,
                "billingAddress": self.billing_address_dict
            },
            headers=self.headers
        )

        # Check the result
        self.assert200(response)
        self.assertEqual(response.json['creatorOrgId'], self.orgid)
        self.assertEqual(response.json['receiverOrgId'], self.orgid2)

        self.assertEqual(response.json['brand'], 'visa')
        self.assertEqual(response.json['aliasAccountNumber'], self.token_data['aliasCC'])
        self.assertEqual(response.json['maskedAccountNumber'], self.token_data['maskedCard'].upper())
        self.assertEqual(response.json['expiryMonth'], self.expiry_month)
        self.assertEqual(response.json['expiryYear'], self.expiry_year)
        self.assertEqual(response.json['aliasCvv'], self.token_data['aliasCVV'])
        self.assertEqual(response.json['type'], self.token_data['cardInfo']['type'])
        self.assertEqual(response.json['cardholderName'], self.cardholder_name)
        self.assertEqual(response.json['billingAddress'], self.billing_address_dict)

        # Retrieve the token
        response_get = self.client.get(
            path='/api/v1/tokens/%s' % response.json['id'],
            headers=self.headers
        )
        self.assert200(response_get)
        self.assertEqual(response_get.json['id'], response.json['id'])
        self.assertEqual(response_get.json['creatorOrgId'], self.orgid)
        self.assertEqual(response_get.json['receiverOrgId'], self.orgid2)
        self.assertEqual(response.json['brand'], 'visa')
        self.assertEqual(response.json['aliasAccountNumber'], self.token_data['aliasCC'])
        self.assertEqual(response.json['maskedAccountNumber'], self.token_data['maskedCard'].upper())
        self.assertEqual(response.json['expiryMonth'], self.expiry_month)
        self.assertEqual(response.json['expiryYear'], self.expiry_year)
        self.assertEqual(response.json['aliasCvv'], self.token_data['aliasCVV'])
        self.assertEqual(response.json['type'], self.token_data['cardInfo']['type'])
        self.assertEqual(response.json['cardholderName'], self.cardholder_name)
        self.assertEqual(response.json['billingAddress'], self.billing_address_dict)

        # Delete the token
        response_del = self.client.delete(
            path='/api/v1/tokens/%s' % response.json['id'],
            headers=self.headers
        )
        self.assert200(response_del)

        # Try to retrieve again
        response_get = self.client.get(
            path='/api/v1/tokens/%s' % response.json['id'],
            headers=self.headers
        )
        self.assert404(response_get)

    @mock.patch('requests.post')
    @mock.patch('requests.get')
    def test_create_travel_account_token(self, mock_get, mock_post):
        """
        Create a travel account token
        """
        self.mock_post.return_value.json.return_value = self.token_data

        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = self.token_data
        mock_post.side_effect = [
            mock.Mock(status_code=200, json=mock.Mock(return_value=self.token_data)),
            mock.Mock(status_code=200, json=mock.Mock(return_value={'transactionId': '3443243'}))
        ]

        response = self.client.post(
            path='/api/v1/tokens/travel-account',
            json={
                "currency": self.currency,
                "amount": self.amount,
                "receiverOrgId": self.orgid2,
                "customerReferences": {
                    "costCenter": "ABCDE-4",
                    "projectCode": "ABCDE-4",
                    "employeeId": "ABCDE-4",
                    "travellerLastName": "DOE",
                    "travellerFirstName": "JOHN"
                }
            },
            headers=self.headers
        )

        # Check the result
        self.assert200(response)
        self.assertEqual(response.json['creatorOrgId'], self.orgid)
        self.assertEqual(response.json['receiverOrgId'], self.orgid2)
        self.assertEqual(response.json['amount'], self.formatted_amount)
        self.assertEqual(response.json['currency'], self.currency)

        self.assertEqual(response.json['brand'], 'amex')
        self.assertEqual(response.json['aliasAccountNumber'], self.token_data['aliasCC'])
        self.assertEqual(response.json['maskedAccountNumber'], self.token_data['maskedCard'].upper())
        self.assertEqual(response.json['expiryMonth'], self.expiry_month)
        self.assertEqual(response.json['expiryYear'], self.expiry_year)
        self.assertEqual(response.json['aliasCvv'], self.token_data['aliasCVV'])
        self.assertEqual(response.json['type'], self.token_data['cardInfo']['type'])
        self.assertEqual(response.json['billingAddress'], self.billing_address_dict)

    @mock.patch('requests.post')
    @mock.patch('requests.get')
    def test_token_travel_components(self, mock_get, mock_post):
        """
        Test data enrichment for travel components in travel account tokens
        """
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = self.token_data
        mock_post.side_effect = [
            mock.Mock(status_code=200, json=mock.Mock(return_value=self.token_data)),
            mock.Mock(status_code=200, json=mock.Mock(return_value={'transactionId': '3443243'}))
        ]

        self.mock_post.return_value.json.return_value = self.token_data
        response = self.client.post(
            path='/api/v1/tokens/travel-account',
            json={
                "currency": self.currency,
                "amount": self.amount,
                "receiverOrgId": self.orgid2,
                "customerReferences": {
                    "costCenter": "ABCDE-4",
                    "projectCode": "ABCDE-4",
                    "employeeId": "ABCDE-4",
                    "travellerLastName": "DOE",
                    "travellerFirstName": "JOHN"
                }
            },
            headers=self.headers
        )
        self.assert200(response, "Request failed: [%i] %s" % (response.status_code, response.json))
        token_uuid = response.json['id']

        # Update the travel token with travel components
        self.mock_post.return_value.json.return_value = self.travel_components_data
        response = self.client.post(
            path=f'/api/v1/tokens/{token_uuid}/travel-components',
            json=self.travel_components_data,
            headers=self.headers
        )

        self.assert200(response)
        self.assertDictContainsSubset(self.travel_components_data[0], response.json[0])

        # Retrieve the token travel components
        self.mock_get.return_value.json.return_value = self.travel_components_data
        response = self.client.get(
            path=f'/api/v1/tokens/{token_uuid}/travel-components',
            headers=self.headers
        )
        self.assert200(response)
        self.assertDictContainsSubset(self.travel_components_data[0], response.json[0])
