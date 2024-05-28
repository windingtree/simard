""""
Define a class to manage the Stripe webhook
"""
from decimal import Decimal
from simard.settings import GLIDER_OTA_ORGID, SIMARD_ORGID, STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET
from simard.balance_manager import BalanceManager
from model.exception import SimardException
import stripe
stripe.api_key = STRIPE_API_KEY

class StripeManagerException(SimardException):
    pass


class StripeManager(object):

    @staticmethod
    def validate_signature(request):
        """
        Validate the signature of an event
        """
        try:
            # Check if signature is present
            if 'Stripe-Signature' not in request.headers:
                raise StripeManagerException('Missing signature', 400)

            # Get the event and verify the request
            verified_event = stripe.Webhook.construct_event(
                request.get_data(),
                request.headers['Stripe-Signature'],
                STRIPE_WEBHOOK_SECRET
            )
            return verified_event
        except ValueError as e:
            raise StripeManagerException('Invalid Payload [%s]' % str(e), 400) \
                from e
        except stripe.error.SignatureVerificationError as e:
            raise StripeManagerException('Invalid Signature [%s]' % str(e), 400) \
                from e

    @staticmethod
    def process_webook(request):
        """
        Process a webhook event
        """
        verified_event = StripeManager.validate_signature(request)

        if verified_event.type == 'charge.succeeded':
            # Extract the values
            currency = verified_event.data.object.currency.upper()
            amount = str(Decimal(verified_event.data.object.amount) / Decimal(100))

            # Update the balance amount
            return BalanceManager.add_deposit(
                orgid=GLIDER_OTA_ORGID,
                agent='did:orgid:' + SIMARD_ORGID + '#stripe',
                currency=currency,
                amount=amount,
                source='stripe'
            )

        else:
            # Unexpected event type
            raise StripeManagerException('Unexpected webook event type', 400)
