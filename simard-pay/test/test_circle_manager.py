import unittest
from simard.circle_manager import CircleManager, CircleManagerException
from simard.db import db
import mongomock
from unittest import mock
import json
from bson.decimal128 import Decimal128
from web3 import Web3

ETHEREUM_RPC = 'wss://ropsten.infura.io/ws/v3/2fd62c57b57e4f27b8d6909d07c2b6d1'
PAYMENT_MANAGER_CONTRACT = '0x0000000000000000000000000000000000099338'
USDC_CONTRACT = '0x0000000000000000000000000000000000099337'
USDC_DECIMALS = 6
SIMARD_ORGID = '0x0000000000000000000000000000000000000000000000000000000000003121'
GLIDER_OTA_ORGID = '0x0000000000000000000000000000000000000000000000000000000000007121'
CIRCLE_WALLET_ADDRESS = '0x0000000000000000000000000000000000099336'
GLIDER_OTA_ORGID = '0x0000000000000000000000000000000000000000000000000000000000007121'

@mock.patch("simard.settlement.SIMARD_ORGID", SIMARD_ORGID)
@mock.patch("simard.settlement.GLIDER_OTA_ORGID", GLIDER_OTA_ORGID)
@mock.patch("simard.settlement.USDC_CONTRACT", USDC_CONTRACT)
@mock.patch("simard.settlement.USDC_DECIMALS", USDC_DECIMALS)
@mock.patch("simard.settlement.PAYMENT_MANAGER_CONTRACT", PAYMENT_MANAGER_CONTRACT)
@mock.patch("simard.settlement.w3", Web3(Web3.WebsocketProvider(ETHEREUM_RPC)))
@mock.patch("simard.circle_manager.CIRCLE_WALLET_ADDRESS", CIRCLE_WALLET_ADDRESS)
@mock.patch("simard.circle_manager.SIMARD_ORGID", SIMARD_ORGID)
@mock.patch("simard.circle_manager.GLIDER_OTA_ORGID", GLIDER_OTA_ORGID)
class TestCircleManager(unittest.TestCase):
    def setUp(self):
        db._database = mongomock.MongoClient().unittest

    def test_validate_topic_success(self):
        """
        Test that the topic is validated
        """
        payload = {
            "Type": "Notification",
            "MessageId": "05dd4857-b93f-5a6c-a230-000000000000",
            "TopicArn": "arn:aws:sns:us-east-1:000000000384:sandbox_platform-notifications-topic",
        }
        self.assertTrue(CircleManager.validate_topic(payload))

    def test_validate_topic_reject(self):
        """
        Test that an incorrect topic is invalidated
        """
        payload = {
            "Type": "Notification",
            "MessageId": "05dd4857-b93f-5a6c-a230-000000000000",
            "TopicArn": "arn:aws:sns:us-east-1:000000000385:sandbox_platform-notifications-topic",
        }
        with self.assertRaises(CircleManagerException) as e:
            CircleManager.validate_topic(payload)
            self.assertEqual(e.code, 400)

    def test_validate_topic_missing(self):
        """
        Test that an incorrect topic is invalidated
        """
        payload = {
            "Type": "Notification",
            "MessageId": "05dd4857-b93f-5a6c-a230-000000000000",
        }
        with self.assertRaises(CircleManagerException) as e:
            CircleManager.validate_topic(payload)
            self.assertEqual(e.code, 400)

    def test_process_subscription_confirmation_success(self):
        """
        Test that we confirm the subscription confirmations
        """
        # From https://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.prepare.html
        payload = {
            "Type": "SubscriptionConfirmation",
            "TopicArn": "arn:aws:sns:us-west-2:123456789012:MyTopic",
            "Message": "You have chosen to subscribe to the topic arn:aws:sns:us-west-2:123456789012:MyTopic.\nTo confirm the subscription, visit the SubscribeURL included in this message.",
            "SubscribeURL": "https://sns.us-west-2.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-west-2:123456789012:MyTopic&Token=2336412f37...",
        }

        with mock.patch('requests.get') as g:
            g.return_value.text = '<dummy>'
            result = CircleManager.process_subscription_confirmation(payload)
            self.assertTrue(result)
            g.assert_called_once_with(payload['SubscribeURL'])

    def test_process_subscription_confirmation_failure(self):
        """
        Test that we fail nicely on invalid messages
        """
        payload = {
            "Type": "SubscriptionConfirmation",
            "TopicArn": "arn:aws:sns:us-west-2:123456789012:MyTopic",
            "Message": "You have chosen to subscribe to the topic arn:aws:sns:us-west-2:123456789012:MyTopic.\nTo confirm the subscription, visit the SubscribeURL included in this message.",
        }

        with self.assertRaises(CircleManagerException) as e:
            CircleManager.process_subscription_confirmation(payload)
            self.assertEqual(e.code, 400)

    def test_process_notification_success(self):
        """
        Test that we can ack notifications
        """
        message = {
            "clientId": "fea2ca9b-b759-4341-98b1-000000000000",
            "notificationType": "transfers",
            "version": 1,
            "customAttributes": {
                "clientId": "fea2ca9b-b759-4341-98b1-000000000000"
            },
            "transfer": {
                "id": "d48dff97-854e-3f82-afa1-000000000000",
                "source": {
                    "type": "blockchain",
                    "chain": "ETH"
                },
                "destination": {
                    "type": "wallet",
                    "id": "1000049660",
                    "address": "0x0000000000000000000000000000000000099336"
                },
                "amount": {
                    "amount": "134.78",
                    "currency": "USD"
                },
                "transactionHash": "0x333000000000000000000000000000000000000000000000000000000000a121",
                "status": "pending",
                "createDate": "2020-11-17T10:48:00.496Z"
            }
        }
        payload = {
            "Type": "Notification",
            "TopicArn": "arn:aws:sns:us-west-2:123456789012:MyTopic",
            "Message": json.dumps(message),
        }

        # Process the notification
        settlement_uuid = CircleManager.process_notification(payload)

        # Retrieve the settlement
        s = db._database.settlements.find_one({
            'uuid': settlement_uuid
        })
        self.assertEqual(s['initiator'], SIMARD_ORGID)
        self.assertEqual(s['beneficiary'], '0x0000000000000000000000000000000000000000000000000000000000009121')
        self.assertEqual(s['amount'], Decimal128('10'))
        self.assertEqual(s['currency'], 'USD')
        self.assertEqual(s['agent'], 'did:orgid:' + SIMARD_ORGID + '#circle')
