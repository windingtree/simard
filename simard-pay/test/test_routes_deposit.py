from flask_testing import TestCase
from simard import app
from unittest import mock
from decimal import Decimal
from simard.db import db
import mongomock
from bson.decimal128 import Decimal128
import uuid
from model.exception import SimardException
import json
from web3 import Web3

ETHEREUM_RPC = 'wss://ropsten.infura.io/ws/v3/00000000000000000000000000000000'
PAYMENT_MANAGER_CONTRACT = '0x0000000000000000000000000000000000099338'
USDC_CONTRACT = '0x0000000000000000000000000000000000099337'
USDC_DECIMALS = '6'
SIMARD_ORGID = '0x0000000000000000000000000000000000000000000000000000000000003121'
GLIDER_OTA_ORGID = '0x0000000000000000000000000000000000000000000000000000000000007121'
TRANSFERWISE_API_ENDPOINT = 'https://api.sandbox.transferwise.tech/v1'
TRANSFERWISE_API_TOKEN = '52a1a8f0-f962-478e-83a4-000000000000'
TRANSFERWISE_PROFILE_ID = '16027720'

@mock.patch("simard.settlement.SIMARD_ORGID", SIMARD_ORGID)
@mock.patch("simard.settlement.GLIDER_OTA_ORGID", GLIDER_OTA_ORGID)
@mock.patch("simard.settlement.USDC_CONTRACT", USDC_CONTRACT)
@mock.patch("simard.settlement.USDC_DECIMALS", USDC_DECIMALS)
@mock.patch("simard.settlement.PAYMENT_MANAGER_CONTRACT", PAYMENT_MANAGER_CONTRACT)
@mock.patch("simard.settlement.w3", Web3(Web3.WebsocketProvider(ETHEREUM_RPC)))
@mock.patch("simard.quote.TRANSFERWISE_API_ENDPOINT", TRANSFERWISE_API_ENDPOINT)
@mock.patch("simard.quote.TRANSFERWISE_API_TOKEN", TRANSFERWISE_API_TOKEN)
@mock.patch("simard.quote.TRANSFERWISE_PROFILE_ID", TRANSFERWISE_PROFILE_ID)
class DepositRouteTest(TestCase):
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

    def test_deposit_success(self):
        """
        Test a sucessful deposit
        """
        response = self.client.post(
            path='/api/v1/balances/deposits',
            json={
                "instrument": "blockchain",
                "chain": "ethereum",
                "transactionHash": "0x333000000000000000000000000000000000000000000000000000000000a121"
            },
            headers=self.headers
        )

        # Check the result
        self.assertEqual(response.status_code, 200)

    def test_quote_success(self):
        """
        Test a sucessful deposit
        """
        response = self.client.post(
            path='/api/v1/quotes',
            json={
                'sourceCurrency': 'USD',
                'targetCurrency': 'EUR',
                'targetAmount': '10.00',
            },
            headers=self.headers
        )

        # Check the result
        self.assertEqual(response.status_code, 200)

    def test_quote_swap(self):
        """
        Test a sucessful quote and swap
        """
        # Create a quote
        quote_response = self.client.post(
            path='/api/v1/quotes',
            json={
                'sourceCurrency': 'USD',
                'targetCurrency': 'EUR',
                'targetAmount': '10.00',
            },
            headers=self.headers
        )
        self.assertEqual(quote_response.status_code, 200)

        # Attempt to swap without deposit
        swap_response = self.client.post(
            path='/api/v1/balances/swap',
            json={
                'quotes': [quote_response.json['quoteId']]
            },
            headers=self.headers
        )
        self.assertEqual(swap_response.status_code, 400)

        # Make a deposit
        deposit_response = self.client.post(
            path='/api/v1/balances/simulateDeposit',
            headers=self.headers,
            json={
                "currency": 'USD',
                "amount": "12500.00"
            }
        )
        self.assert200(deposit_response)

        # Attempt to swap again
        swap_response = self.client.post(
            path='/api/v1/balances/swap',
            json={
                'quotes': [quote_response.json['quoteId']]
            },
            headers=self.headers
        )
        self.assertEqual(swap_response.status_code, 200)
