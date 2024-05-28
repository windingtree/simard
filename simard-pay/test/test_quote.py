from unittest import TestCase
from simard.quote import Quote, QuoteException
from decimal import Decimal
from simard.db import db
import mongomock
import uuid
from datetime import datetime, timezone
from unittest import mock
import simplejson as json

TRANSFERWISE_API_ENDPOINT = 'https://transferwise.url/v1'
TRANSFERWISE_API_TOKEN = '52a1a8f0-f962-478e-83a4-000000000000'
TRANSFERWISE_PROFILE_ID = '00000000'

@mock.patch("simard.quote.TRANSFERWISE_API_ENDPOINT", TRANSFERWISE_API_ENDPOINT)
@mock.patch("simard.quote.TRANSFERWISE_API_TOKEN", TRANSFERWISE_API_TOKEN)
@mock.patch("simard.quote.TRANSFERWISE_PROFILE_ID", TRANSFERWISE_PROFILE_ID)
class QuoteTest(TestCase):
    def setUp(self):
        # Override database with mock
        db._database = mongomock.MongoClient().unittest

        # Define common test variables
        self.q1_initiator = "1234"
        self.q1_agent = "myAgent"
        self.q1_source_amount = Decimal('300.45')
        self.q1_target_amount = Decimal('400.12')
        self.q1_source_currency = "EUR"
        self.q1_target_currency = "USD"
        self.q1_id = "000000000000000000000000"
        self.q1_rate = Decimal('0.912')
        self.q1_transferwise_id = 123456789

    def test_init_with_source_amount(self):
        """
        Test that all values are properly instantiated
        """
        q1 = Quote(
            orgid=self.q1_initiator,
            agent=self.q1_agent,
            source_amount=self.q1_source_amount,
            source_currency=self.q1_source_currency,
            target_currency=self.q1_target_currency,
        )
        self.assertEqual(q1.orgid, self.q1_initiator)
        self.assertEqual(q1.agent, self.q1_agent)
        self.assertEqual(q1.source_amount, self.q1_source_amount)
        self.assertEqual(q1.source_currency, self.q1_source_currency)
        self.assertEqual(q1.target_currency, self.q1_target_currency)
        self.assertEqual(q1.agent, self.q1_agent)
        self.assertIsNone(q1.target_amount)
        self.assertIsNone(q1._id)
        self.assertIsNone(q1.rate)
        self.assertIsNone(q1.transferwise_id)
        self.assertFalse(q1.is_used)
        self.assertRegex(
            str(q1.uuid),
            '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$'
        )

    def test_init_with_target_amount(self):
        """
        Test that all values are properly instantiated
        """
        q1 = Quote(
            orgid=self.q1_initiator,
            agent=self.q1_agent,
            target_amount=self.q1_target_amount,
            source_currency=self.q1_source_currency,
            target_currency=self.q1_target_currency,
        )
        self.assertEqual(q1.orgid, self.q1_initiator)
        self.assertEqual(q1.agent, self.q1_agent)
        self.assertEqual(q1.target_amount, self.q1_target_amount)
        self.assertEqual(q1.source_currency, self.q1_source_currency)
        self.assertEqual(q1.target_currency, self.q1_target_currency)
        self.assertEqual(q1.agent, self.q1_agent)
        self.assertIsNone(q1.source_amount)
        self.assertIsNone(q1._id)
        self.assertIsNone(q1.rate)
        self.assertIsNone(q1.transferwise_id)
        self.assertFalse(q1.is_used)
        self.assertRegex(
            str(q1.uuid),
            '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$'
        )

    def test_init_with_both_source_and_target_amount(self):
        """
        Test that we can't create a quote with both source and target amounts
        """
        with self.assertRaises(QuoteException) as ctx:
            q1 = Quote(
                orgid=self.q1_initiator,
                agent=self.q1_agent,
                source_amount=self.q1_source_amount,
                target_amount=self.q1_target_amount,
                source_currency=self.q1_source_currency,
                target_currency=self.q1_target_currency,
            )
        self.assertEqual(ctx.exception.code, 400)

    def test_init_without_both_source_and_target_amount(self):
        """
        Test that we can't create a quote with both source and target amounts missing
        """
        with self.assertRaises(QuoteException) as ctx:
            q1 = Quote(
                orgid=self.q1_initiator,
                agent=self.q1_agent,
                source_currency=self.q1_source_currency,
                target_currency=self.q1_target_currency,
            )
        self.assertEqual(ctx.exception.code, 400)

    def test_store(self):
        """
        Test that we can't create a quote with both source and target amounts missing
        """
        q1 = Quote(
            orgid=self.q1_initiator,
            agent=self.q1_agent,
            target_amount=Decimal('123.45'),
            source_currency=self.q1_source_currency,
            target_currency=self.q1_target_currency,
        )

        # Check we can't store a quote without processing it
        with self.assertRaises(QuoteException) as ctx:
            q1.store()
        self.assertEqual(ctx.exception.code, 500)

        # Simulate the transferwise process
        q1.transferwise_id = self.q1_transferwise_id
        q1.rate = Decimal('0.68')
        q1.source_amount = Decimal('456.68')

        q1.store()
        self.assertEqual(q1.orgid, self.q1_initiator)
        self.assertEqual(q1.agent, self.q1_agent)
        self.assertEqual(q1.source_amount, Decimal('456.68'))
        self.assertEqual(q1.target_amount, Decimal('123.45'))
        self.assertEqual(q1.source_currency, self.q1_source_currency)
        self.assertEqual(q1.target_currency, self.q1_target_currency)
        self.assertEqual(q1.agent, self.q1_agent)
        self.assertEqual(q1.rate, Decimal('0.68'))
        self.assertEqual(q1.transferwise_id, self.q1_transferwise_id)
        self.assertFalse(q1.is_used)
        self.assertRegex(
            str(q1.uuid),
            '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$'
        )

    @mock.patch('requests.post')
    def test_create_transferwise(self, mock_post):
        """
        Test to create a transferwise quote
        """
        # Create a quote
        q1 = Quote(
            orgid=self.q1_initiator,
            agent=self.q1_agent,
            target_amount=self.q1_target_amount,
            source_currency=self.q1_source_currency,
            target_currency=self.q1_target_currency,
        )

        # Simulate the Transferwise Response
        mock_post.return_value.json.return_value = {
            "id": self.q1_transferwise_id,
            "source": self.q1_source_currency,
            "target": self.q1_target_currency,
            "sourceAmount": self.q1_source_amount,
            "targetAmount": self.q1_target_amount,
            "type": "BALANCE_CONVERSION",
            "rate": self.q1_rate,
            "createdTime": "2018-08-27T14:35:44.553Z",
            "createdByUserId": '<your user id>',
            "profile": '<your profile id>',
            "rateType": "FIXED",
            "deliveryEstimate": "2018-08-27T14:35:44.496Z",
            "fee": 2.34,
            "feeDetails": {
                "transferwise": 2.34,
                "payIn": 0.0,
                "discount": 0.0,
                "partner": 0.0
            },
            "allowedProfileTypes": [
                "PERSONAL",
                "BUSINESS"
            ],
            "guaranteedTargetAmount": False,
            "ofSourceAmount": True
        }
        mock_post.return_value.text = json.dumps(mock_post.return_value.json.return_value, use_decimal=True)
        mock_post.return_value.status_code = 200

        # Execute and check the values
        q2 = q1.create_transferwise()
        self.assertEqual(q1, q2)
        self.assertEqual(q1.transferwise_id, self.q1_transferwise_id)

        # Check the Mock Call
        mock_post.assert_called_once_with(
            TRANSFERWISE_API_ENDPOINT + '/quotes',
            json={
                'profile': int(TRANSFERWISE_PROFILE_ID),
                'source': self.q1_source_currency,
                'target': self.q1_target_currency,
                'rateType': 'FIXED',
                'type': 'BALANCE_CONVERSION',
                'targetAmount': self.q1_target_amount,
            },
            headers={
                'Authorization': ("Bearer %s" % TRANSFERWISE_API_TOKEN),
                'Content-Type': 'application/json',
            }
        )

    @mock.patch('requests.post')
    def test_create_transferwise_inverted(self, mock_post):
        """
        Test to create a transferwise quote
        """
        # Create a quote
        q1 = Quote(
            orgid=self.q1_initiator,
            agent=self.q1_agent,
            source_amount=self.q1_source_amount,
            source_currency=self.q1_source_currency,
            target_currency=self.q1_target_currency,
        )

        # Simulate the Transferwise Response
        mock_post.return_value.json.return_value = {
            "id": self.q1_transferwise_id,
            "source": self.q1_source_currency,
            "target": self.q1_target_currency,
            "sourceAmount": self.q1_source_amount,
            "targetAmount": self.q1_target_amount,
            "type": "BALANCE_CONVERSION",
            "rate": self.q1_rate,
            "createdTime": "2018-08-27T14:35:44.553Z",
            "createdByUserId": '<your user id>',
            "profile": '<your profile id>',
            "rateType": "FIXED",
            "deliveryEstimate": "2018-08-27T14:35:44.496Z",
            "fee": 2.34,
            "feeDetails": {
                "transferwise": 2.34,
                "payIn": 0.0,
                "discount": 0.0,
                "partner": 0.0
            },
            "allowedProfileTypes": [
                "PERSONAL",
                "BUSINESS"
            ],
            "guaranteedTargetAmount": False,
            "ofSourceAmount": True
        }
        mock_post.return_value.text = json.dumps(mock_post.return_value.json.return_value, use_decimal=True)
        mock_post.return_value.status_code = 200

        # Execute and check the values
        q2 = q1.create_transferwise()
        self.assertEqual(q1, q2)
        self.assertEqual(q1.transferwise_id, self.q1_transferwise_id)

        # Check the Mock Call
        mock_post.assert_called_once_with(
            TRANSFERWISE_API_ENDPOINT + '/quotes',
            json={
                'profile': int(TRANSFERWISE_PROFILE_ID),
                'source': self.q1_source_currency,
                'target': self.q1_target_currency,
                'rateType': 'FIXED',
                'type': 'BALANCE_CONVERSION',
                'sourceAmount': self.q1_source_amount,
            },
            headers={
                'Authorization': ("Bearer %s" % TRANSFERWISE_API_TOKEN),
                'Content-Type': 'application/json',
            }
        )
