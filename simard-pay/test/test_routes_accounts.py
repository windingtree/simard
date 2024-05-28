from flask_testing import TestCase
from simard import app
from simard.db import db
import uuid
from unittest import mock
import mongomock


class AccountsRouteTest(TestCase):
    def setUp(self):
        self.iban = "BE71096123456769"
        self.currency = 'EUR'

        db._database = mongomock.MongoClient().unittest

        # JWT Token is fake since we mock the call to the token verification
        self.jwt = '<header>.<claim>.<signature>'
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer %s' % self.jwt
        }

        self.orgid = '0x0000000000000000000000000000000000000000000000000000000000001121'
        self.agent = 'did:orgid:%s#secondkey' % self.orgid

        # Mock the token to avoid making external calls
        # Can be overriden with self.mock_validate_token.return_value
        patcher = mock.patch(
            'simard.oauth_manager.OAuthManager.validate_token',
            return_value=(self.orgid, self.agent)
        )
        self.mock_validate_token = patcher.start()
        self.addCleanup(patcher.stop)

        # A Patcher for the DID Resolver
        resolve_patcher = mock.patch(
            'simard.did_resolver.DidResolver.resolve',
            return_value={
                'id': self.orgid,
                'didDocument': {
                    "legalEntity": {
                        "legalName": "My Super Company",
                        "legalType": "OÜ",
                        "registeredAddress": {
                            "country": "EE",
                            "subdivision": "37",
                            "locality": "Tallinn",
                            "postalCode": "10115",
                            "streetAddress": "Tartu mnt 67/1",
                            "premise": "13b"
                        },
                    },
                },
            }
        )
        self.resolve_patcher = resolve_patcher.start()
        self.addCleanup(resolve_patcher.stop)

        # A Patcher for the TW POST
        tw_post_patcher = mock.patch('requests.post')
        self.mock_post = tw_post_patcher.start()
        self.mock_post.return_value.json.return_value = {"id": 1234}
        self.mock_post.return_value.status_code = 200
        self.addCleanup(tw_post_patcher.stop)

        # A Patcher for the TW DELETE
        tw_delete_patcher = mock.patch('requests.delete')
        self.mock_delete = tw_delete_patcher.start()
        self.mock_delete.return_value.json.return_value = ""
        self.mock_delete.return_value.status_code = 200
        self.addCleanup(tw_delete_patcher.stop)

        # A Patcher for the event handler
        event_handler_patcher = mock.patch('simard.event_handler.EventHandler.log_event')
        self.mock_event_handler = event_handler_patcher.start()
        self.addCleanup(event_handler_patcher.stop)

    # Create the app
    def create_app(self):
        app.config['TESTING'] = True
        return app

    # Test for a first run the accounts are empty
    def test_get_accounts_empty(self):
        response = self.client.get(
            path='/api/v1/accounts',
            headers=self.headers
        )
        self.assertEqual(response.json, {})
        self.assert200(response)

    # Test Adding an IBAN and BIC
    def test_one_account_lifecycle(self):
        # Add an account
        account_dict = {"iban": self.iban, "currency": self.currency}
        response = self.client.post(
            path="/api/v1/accounts",
            json=account_dict,
            headers=self.headers
        )
        self.assert200(response)
        account_uuid = response.json['accountId']

        # Retrieve
        response = self.client.get(
            path="/api/v1/accounts/%s" % account_uuid,
            headers=self.headers
        )
        self.assert200(response)
        self.assertEqual(response.json, account_dict)

        # Delete
        response = self.client.delete(
            path="/api/v1/accounts/%s" % account_uuid,
            headers=self.headers
        )
        self.assert200(response)
        self.assertEqual(response.json, {})

        # Retrieve
        response = self.client.get(
            path="/api/v1/accounts/%s" % account_uuid,
            headers=self.headers
        )
        self.assert404(response)
        self.assertEqual(response.json, {'message': 'Account reference not found for the organization'})

    def test_update_iban(self):
        # Add Iban without BIC
        response = self.client.post(
            path="/api/v1/accounts",
            json={"iban": self.iban, "currency": self.currency},
            headers=self.headers
        )
        self.assert200(response)
        account_uuid = response.json['accountId']

        # Update the IBAN
        response = self.client.post(
            path="/api/v1/accounts/%s" % account_uuid,
            json={"iban": 'GB98MIDL07009312345678', "currency": self.currency},
            headers=self.headers
        )
        self.assert200(response)
        self.assertEqual(response.json['accountId'], account_uuid)

        # Retrieve
        response = self.client.get(
            path="/api/v1/accounts/%s" % account_uuid,
            headers=self.headers
        )
        self.assert200(response)
        self.assertEqual(response.json, {
            "iban": 'GB98MIDL07009312345678',
            "currency": self.currency
        })

    def test_duplicate_account(self):
        # Add the first account
        response = self.client.post(
            path="/api/v1/accounts",
            json={"iban": self.iban, "currency": self.currency},
            headers=self.headers
        )
        self.assert200(response)

        # Try to add the second account
        response = self.client.post(
            path="/api/v1/accounts",
            json={"iban": self.iban, "currency": self.currency},
            headers=self.headers
        )
        self.assert400(response)
        self.assertEqual(
            response.json,
            {"message": "An account already exists with the same currency"}
        )

        accounts = self.client.get(
            path="/api/v1/accounts",
            headers=self.headers
        )
        self.assertEqual(len(accounts.json.keys()), 1)

    def test_delete_accounts(self):
        # Try deleting an account that does not exist
        fake_uuid = str(uuid.uuid4())
        response = self.client.delete(
            path="/api/v1/accounts/%s" % fake_uuid,
            headers=self.headers
        )
        self.assert404(response)
        self.assertEqual(
            response.json,
            {"message": "Account reference not found for the organization"}
        )

        # Create an account
        response = self.client.post(
            path="/api/v1/accounts",
            json={"iban": self.iban, "currency": self.currency},
            headers=self.headers
        )
        account_uuid = response.json['accountId']

        # Delete it twice
        response = self.client.delete(
            path="/api/v1/accounts/%s" % account_uuid,
            headers=self.headers
        )
        self.assert200(response)
        response = self.client.delete(
            path="/api/v1/accounts/%s" % account_uuid,
            headers=self.headers
        )
        self.assert404(response)
        self.assertEqual(
            response.json,
            {"message": "Account reference not found for the organization"}
        )

    def test_get_fake_accounts(self):
        # Try deleting an account that does not exist
        fake_uuid = str(uuid.uuid4())
        response = self.client.get(
            path="/api/v1/accounts/%s" % fake_uuid,
            headers=self.headers
        )
        self.assert404(response)
        self.assertEqual(
            response.json,
            {"message": "Account reference not found for the organization"}
        )

    def test_update_fake_accounts(self):
        # Try deleting an account that does not exist
        fake_uuid = str(uuid.uuid4())
        response = self.client.post(
            path="/api/v1/accounts/%s" % fake_uuid,
            json={"iban": self.iban, "currency": self.currency},
            headers=self.headers
        )
        self.assert404(response)
        self.assertEqual(
            response.json,
            {"message": "Account reference not found for the organization"}
        )

    def test_update_missing_key(self):
        # Try deleting an account that does not exist
        fake_uuid = str(uuid.uuid4())
        response = self.client.post(
            path="/api/v1/accounts/%s" % fake_uuid,
            json={"iban": self.iban, "wrong": self.currency},
            headers=self.headers
        )
        self.assert400(response)
        self.assertEqual(
            response.json,
            {"message": "Missing mandatory key in parameters: currency"}
        )
