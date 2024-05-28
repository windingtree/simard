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

CIRCLE_WALLET_ADDRESS = '0x0000000000000000000000000000000000099343'
SIMARD_ORGID = '0x0000000000000000000000000000000000000000000000000000000000003121'
GLIDER_OTA_ORGID = '0x0000000000000000000000000000000000000000000000000000000000007121'

@mock.patch("simard.circle_manager.CIRCLE_WALLET_ADDRESS", CIRCLE_WALLET_ADDRESS)
@mock.patch("simard.circle_manager.SIMARD_ORGID", SIMARD_ORGID)
@mock.patch("simard.circle_manager.GLIDER_OTA_ORGID", GLIDER_OTA_ORGID)
class CircleRouteTest(TestCase):
    def setUp(self):
        db._database = mongomock.MongoClient().unittest

        # Mock the requests.get to avoid making external calls
        get_patcher = mock.patch('requests.get')
        self.mock_get = get_patcher.start()
        self.mock_get.return_value.text = '<PATCH>'
        self.addCleanup(get_patcher.stop)

    # Create the app
    def create_app(self):
        app.config['TESTING'] = True
        return app

    def test_notification_subscription(self):
        """
        Test a notification subscription
        """
        response = self.client.post(
            path='/api/v1/balances/circleNotification',
            json={
                "Type": "SubscriptionConfirmation",
                "MessageId": "165545c9-2a5c-472c-8df2-000000000000",
                "Token": "2336412f37f...",
                "TopicArn": "arn:aws:sns:us-east-1:000000000384:sandbox_platform-notifications-topic",
                "Message": "You have chosen to subscribe to the topic arn:aws:sns:us-west-2:123456789012:MyTopic.\nTo confirm the subscription, visit the SubscribeURL included in this message.",
                "SubscribeURL": "https://url.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-west-2:123456789012:MyTopic&Token=2336412f37...",
                "Timestamp": "2012-04-26T20:45:04.751Z",
                "SignatureVersion": "1",
                "Signature": "EXAMPLEpH+...",
                "SigningCertURL": "https://url.com/SimpleNotificationService-0000.pem"
            },
            headers={
                "x-amz-sns-message-type": "SubscriptionConfirmation",
                "x-amz-sns-message-id": "165545c9-2a5c-472c-8df2-000000000000",
                "x-amz-sns-topic-arn": "arn:aws:sns:us-east-1:000000000384:sandbox_platform-notifications-topic",
                "Content-Type": "text/plain; charset=UTF-8",
                "Host": "example.com",
                "Connection": "Keep-Alive",
                "User-Agent": "Amazon Simple Notification Service Agent",
            }
        )

        # Check the result
        self.assertEqual(response.status_code, 200)

    def test_notification_subscription_wrong_topic(self):
        """
        Test a notification subscription
        """
        response = self.client.post(
            path='/api/v1/balances/circleNotification',
            json={
                "Type": "SubscriptionConfirmation",
                "MessageId": "165545c9-2a5c-472c-8df2-000000000000",
                "Token": "2336412f37f...",
                "TopicArn": "arn:aws:sns:us-east-1:000000000385:sandbox_platform-notifications-topic",
                "Message": "You have chosen to subscribe to the topic arn:aws:sns:us-west-2:123456789012:MyTopic.\nTo confirm the subscription, visit the SubscribeURL included in this message.",
                "SubscribeURL": "https://url.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-west-2:123456789012:MyTopic&Token=2336412f37...",
                "Timestamp": "2012-04-26T20:45:04.751Z",
                "SignatureVersion": "1",
                "Signature": "EXAMPLEpH+...",
                "SigningCertURL": "https://url.com/SimpleNotificationService-0000.pem"
            },
            headers={
                "x-amz-sns-message-type": "SubscriptionConfirmation",
                "x-amz-sns-message-id": "165545c9-2a5c-472c-8df2-000000000000",
                "x-amz-sns-topic-arn": "arn:aws:sns:us-east-1:000000000384:sandbox_platform-notifications-topic",
                "Content-Type": "text/plain; charset=UTF-8",
                "Host": "example.com",
                "Connection": "Keep-Alive",
                "User-Agent": "Amazon Simple Notification Service Agent",
            }
        )

        # Check the result
        self.assertEqual(response.status_code, 400)

    def test_notification_success(self):
        """
        Test a notification
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
                    "id": "1234549660",
                    "address": "0x0000000000000000000000000000000000099342"
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
        response = self.client.post(
            path='/api/v1/balances/circleNotification',
            json={
                "Type": "Notification",
                "MessageId": "22b80b92-fdea-4c2c-8f9d-000000000000",
                "TopicArn": "arn:aws:sns:us-east-1:000000000384:sandbox_platform-notifications-topic",
                "Subject": "My First Message",
                "Message": json.dumps(message),
                "Timestamp": "2012-05-02T00:54:06.655Z",
                "SignatureVersion": "1",
                "Signature": "EXAMPLEw6JRN...",
                "SigningCertURL": "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-0000.pem",
                "UnsubscribeURL": "https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:123456789012:MyTopic:c9135db0-26c4-47ec-8998-000000000000"
            },
            headers={
                "x-amz-sns-message-type": "Notification",
                "x-amz-sns-message-id": "22b80b92-fdea-4c2c-8f9d-000000000000",
                "x-amz-sns-topic-arn": "arn:aws:sns:us-east-1:000000000384:sandbox_platform-notifications-topic",
                "x-amz-sns-subscription-arn": "arn:aws:sns:us-west-2:123456789012:MyTopic:c9135db0-26c4-47ec-8998-000000000000",
                "Content-Type": "text/plain; charset=UTF-8",
                "Host": "example.com",
                "Connection": "Keep-Alive",
                "User-Agent": "Amazon Simple Notification Service Agent",
            }
        )

        # Check the result
        self.assertEqual(response.status_code, 200)

        # Retrieve the settlement
        s = db._database.settlements.find_one({
            'uuid': response.json['settlementId']
        })
        # These values are linked to the Ethereum transaction hash. Should be mocked instead.
        self.assertEqual(s['initiator'], SIMARD_ORGID)
        self.assertEqual(s['beneficiary'], GLIDER_OTA_ORGID)
        self.assertEqual(s['amount'], Decimal128('10'))
        self.assertEqual(s['currency'], 'USD')
        self.assertEqual(s['agent'], 'did:orgid:' + SIMARD_ORGID + '#circle')
