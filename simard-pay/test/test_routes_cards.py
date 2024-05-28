from flask_testing import TestCase
from simard import app
from unittest import mock
from decimal import Decimal
from simard.db import db
import mongomock
from bson.decimal128 import Decimal128
import uuid
from model.exception import SimardException
from simard.settings import VIRTUAL_CARD_ORGID, GLIDER_B2B_ORGID
from simard.virtualcard import VirtualCard


class CardRouteTest(TestCase):
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
        self.agent = 'did:orgid:%s#secondkey' % self.orgid
        self.currency = 'EUR'

        # Mock the token to avoid making external calls
        # Can be overriden with self.mock_validate_token.return_value
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

    def test_create_card_restricted(self):
        """
        Test a card creation from unauthorized ORGiD
        """

        response = self.client.post(
            path='/api/v1/cards',
            json={
                "currency": "EUR",
                "amount": "300.00",
                "expiration": "2052-03-30T13:37:38Z"
            },
            headers=self.headers
        )

        # Check the result
        self.assertEqual(response.status_code, 503)

    def test_create_card_no_balance(self):
        """
        Test a card creation when no balance
        """
        self.mock_validate_token.return_value = (GLIDER_B2B_ORGID, self.agent + "BENEF")

        response = self.client.post(
            path='/api/v1/cards',
            json={
                "currency": "EUR",
                "amount": "300.00",
                "expiration": "2052-03-30T13:37:38Z"
            },
            headers=self.headers
        )

        # Check the result
        self.assert400(response)
        self.assertEqual(response.json, {
            "message": "Insufficient balance to create guarantee"
        })

    def test_create_card_success(self):
        """
        Test a card creation
        """
        beneficiary = GLIDER_B2B_ORGID
        self.mock_validate_token.return_value = (beneficiary, self.agent + "BENEF")

        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('5000.00')
            response = self.client.post(
                path='/api/v1/cards',
                json={
                    "currency": "EUR",
                    "amount": "300.00",
                    "expiration": "2052-03-30T13:37:38Z"
                },
                headers=self.headers
            )
        self.assert200(response)

        # Check the guarantee
        g1 = db._database.guarantees.find_one({'uuid': response.json['id']})
        self.assertEqual(g1['initiator'], beneficiary)
        self.assertEqual(g1['beneficiary'], VIRTUAL_CARD_ORGID)
        self.assertEqual(g1['amount'], Decimal128('300.00'))
        self.assertEqual(g1['currency'], 'EUR')
        self.assertEqual(g1['agent'], self.agent + "BENEF")
        self.assertEqual(g1['expiration'], "2052-03-30T13:37:38+00:00")

        self.assertEqual(response.json, {
            'id': response.json['id'],
            'accountNumber': '4444333322221111',
            'cvv': '737',
            'expiryMonth': '10',
            'expiryYear': '2020',
            'type': 'debit',
            'brand': 'visa'
        })

    def test_cancel_card_success(self):
        """
        Test a card cancelation
        """
        beneficiary = GLIDER_B2B_ORGID
        self.mock_validate_token.return_value = (beneficiary, self.agent + "BENEF")

        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('5000.00')
            response = self.client.post(
                path='/api/v1/cards',
                json={
                    "currency": "EUR",
                    "amount": "300.00",
                    "expiration": "2052-03-30T13:37:38Z"
                },
                headers=self.headers
            )
        self.assert200(response)
        card_id = response.json['id']

        # Cancel the card
        response = self.client.delete(
            path='/api/v1/cards/%s' % card_id,
            headers=self.headers
        )
        print(response.json)
        self.assert200(response)
        g1 = db._database.guarantees.find_one({'uuid': card_id})
        self.assertIsNone(g1)

    def test_cancel_card_not_owned(self):
        """
        Test a card cancelation when not owned
        """
        beneficiary = GLIDER_B2B_ORGID
        self.mock_validate_token.return_value = (beneficiary, self.agent + "BENEF")

        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('5000.00')
            response = self.client.post(
                path='/api/v1/cards',
                json={
                    "currency": "EUR",
                    "amount": "300.00",
                    "expiration": "2052-03-30T13:37:38Z"
                },
                headers=self.headers
            )
        self.assert200(response)

        # Cancel the card
        self.mock_validate_token.return_value = (self.orgid, self.agent + "BENEF")
        response = self.client.delete(
            path='/api/v1/cards/%s' % response.json['id'],
            headers=self.headers
        )
        self.assert403(response)
        self.assertEqual(response.json, {
            'message': 'Card can only be canceled by the card creator'
        })

    def test_cancel_card_not_found(self):
        """
        Test a card cancelation random number
        """

        # Cancel the card
        response = self.client.delete(
            path='/api/v1/cards/%s' % str(uuid.uuid4()),
            headers=self.headers
        )
        self.assert404(response)
        self.assertEqual(response.json, {
            'message': 'Card not found'
        })
