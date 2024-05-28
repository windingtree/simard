""""
Define a class to manage the Circle notification hook
https://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.prepare.html
"""
import re
import requests
import json
from model.exception import SimardException
from simard.settings import CIRCLE_WALLET_ADDRESS, GLIDER_OTA_ORGID, SIMARD_ORGID
from simard.balance_manager import BalanceManager

circleArn = re.compile("^arn:aws:sns:.*:000000000384:(sandbox|prod)_platform-notifications-topic$")


class CircleManagerException(SimardException):
    pass


class CircleManager(object):

    @staticmethod
    def validate_signature(payload):
        """
        Validate the signature of an event
        """
        # TODO https://gist.github.com/amertkara/e294562759ff2755486e
        # TODO: https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
        return True

    @staticmethod
    def validate_topic(payload):
        """
        Validate the signature of an event
        """
        if 'TopicArn' not in payload:
            raise CircleManagerException('Missing TopicArn', 400)

        match_result = re.match(circleArn, payload['TopicArn'])
        if match_result is None:
            raise CircleManagerException('Invalid TopicArn', 400)

        return True

    @staticmethod
    def process_subscription_confirmation(payload):
        """
        Confirm the subscription
        """
        if 'SubscribeURL' not in payload:
            raise CircleManagerException('Missing SubscribeURL', 400)

        r = requests.get(payload['SubscribeURL'])
        print(r.text)
        return True

    @staticmethod
    def validate_tranfer(transfer):
        # Check if the object needs to be processed
        if 'source' not in transfer:
            raise CircleManagerException('Missing transfer source', 400)
        if 'type' not in transfer['source']:
            raise CircleManagerException('Missing transfer source type', 400)
        if transfer['source']['type'] != 'blockchain':
            raise CircleManagerException('Unexpected source type', 400)
        if 'chain' not in transfer['source']:
            raise CircleManagerException('Unexpected source type', 400)
        if transfer['source']['chain'] != 'ETH':
            raise CircleManagerException('Unexpected chain', 400)
        if 'destination' not in transfer:
            raise CircleManagerException('Missing transfer destination', 400)
        if 'type' not in transfer['destination']:
            raise CircleManagerException('Missing transfer destination type', 400)
        if transfer['destination']['type'] != 'wallet':
            raise CircleManagerException('Unexpected destination type', 400)
        if 'address' not in transfer['destination']:
            raise CircleManagerException('Missing transfer destination address', 400)
        if transfer['destination']['address'] != CIRCLE_WALLET_ADDRESS:
            raise CircleManagerException('Unexpected address', 400)
        if 'transactionHash' not in transfer:
            raise CircleManagerException('Missing transfer transactionHash', 400)
        if 'status' not in transfer:
            raise CircleManagerException('Missing transfer status', 400)
        if 'amount' not in transfer:
            raise CircleManagerException('Missing transfer amount', 400)
        if 'amount' not in transfer['amount']:
            raise CircleManagerException('Missing transfer amount amount', 400)
        if 'currency' not in transfer['amount']:
            raise CircleManagerException('Missing transfer amount currency', 400)

    @staticmethod
    def transaction_hash_from_notification_payload(payload):
        """
        Validate a payload
        """
        # Check for JSON Message Payload
        if 'Message' not in payload:
            raise CircleManagerException('Missing Message', 400)
        notification = json.loads(payload['Message'])

        # Check for Notification Type
        if 'notificationType' not in notification:
            raise CircleManagerException('Missing notificationType', 400)
        if(notification['notificationType'] != 'transfers'):
            raise CircleManagerException('Unexpected notificationType', 400)

        # Check for Transfer object
        if 'transfer' not in notification:
            raise CircleManagerException('Missing transfer object in notification', 400)
        transfer = notification['transfer']

        # Check if the transfer is valid
        CircleManager.validate_tranfer(transfer)

        return transfer['transactionHash']

    @staticmethod
    def process_notification(payload):
        """
        Process the notification
        """
        transaction_hash = CircleManager.transaction_hash_from_notification_payload(payload)

        # TODO: Initiate payout from Circle to Transferwise
        # if transfer['status'] == 'complete':

        # Update the balance amount
        return BalanceManager.add_blockchain_deposit(
            orgid=SIMARD_ORGID,
            agent='did:orgid:' + SIMARD_ORGID + '#circle',
            instrument='blockchain',
            chain='ethereum',
            transaction_hash=transaction_hash
        )

    @staticmethod
    def process_webook(payload):
        """
        Process a webhook event
        """
        # Validate signature and topic
        CircleManager.validate_signature(payload)
        CircleManager.validate_topic(payload)

        # Check Type
        if 'Type' not in payload:
            raise CircleManagerException('Missing Type', 400)
        webhook_type = payload['Type']

        if webhook_type not in ['SubscriptionConfirmation', 'Notification']:
            raise CircleManagerException('Unkown Type', 400)

        # Handle the subscription confirmation
        if webhook_type == 'SubscriptionConfirmation':
            return CircleManager.process_subscription_confirmation(payload)

        # Handle the notification
        if webhook_type == 'Notification':
            return CircleManager.process_notification(payload)

        raise CircleManagerException('Not Implemented', 500)
