import unittest
from simard.balance_manager import BalanceManager, BalanceManagerException, BalanceManagerGuaranteeNotFoundException
from simard.account_manager import AccountManagerException
from simard.balance import Balance
from simard.guarantee import Guarantee
from simard.db import db
from simard.parser import Parser, ParserException
import mongomock
from decimal import Decimal
from bson.decimal128 import Decimal128
from unittest import mock
import uuid
import dateutil.parser
from simard.virtualcard import VirtualCard
from web3 import Web3
from simard.quote import Quote, QuoteException
from simard.quote_manager import QuoteManagerException


ETHEREUM_RPC = 'wss://ropsten.infura.io/ws/v3/2fd62c57b57e4f27b8d6909d07c2b6d1'
PAYMENT_MANAGER_CONTRACT = '0x0000000000000000000000000000000000099338'
USDC_CONTRACT = '0x0000000000000000000000000000000000099337'
USDC_DECIMALS = '6'
SIMARD_ORGID = '0x0000000000000000000000000000000000000000000000000000000000003121'
GLIDER_OTA_ORGID = '0x0000000000000000000000000000000000000000000000000000000000007121'
VIRTUAL_CARD_ORGID = SIMARD_ORGID
GLIDER_B2B_ORGID = '0x0000000000000000000000000000000000000000000000000000000000009121'
VIRTUAL_CARD_DETAILS = '4444333322221111|10|2020|737|visa|debit'
TRANSFERWISE_API_ENDPOINT = 'https://api.sandbox.transferwise.tech/v1'
TRANSFERWISE_API_TOKEN = '52a1a8f0-f962-478e-83a4-000000000000'
TRANSFERWISE_PROFILE_ID = '00000000'

@mock.patch("simard.quote.TRANSFERWISE_API_ENDPOINT", TRANSFERWISE_API_ENDPOINT)
@mock.patch("simard.quote.TRANSFERWISE_API_TOKEN", TRANSFERWISE_API_TOKEN)
@mock.patch("simard.quote.TRANSFERWISE_PROFILE_ID", TRANSFERWISE_PROFILE_ID)
@mock.patch("simard.balance_manager.GLIDER_B2B_ORGID", GLIDER_B2B_ORGID)
@mock.patch("simard.balance_manager.SIMARD_ORGID", SIMARD_ORGID)
@mock.patch("simard.balance_manager.VIRTUAL_CARD_ORGID", VIRTUAL_CARD_ORGID)
@mock.patch("simard.virtualcard.VIRTUAL_CARD_DETAILS", VIRTUAL_CARD_DETAILS)
class TestBalanceManager(unittest.TestCase):
    def setUp(self):
        # Mock DB and clean tables
        db._database = mongomock.MongoClient().unittest
        db._database.settlements.drop()
        db._database.guarantees.drop()

        # Prepare some variables
        self.currency = 'EUR'
        self.ota = 'did:orgid:0x%s01' % ('0' * 62)
        self.airline = 'did:orgid:0x%s02' % ('0' * 62)
        self.glider_b2b = 'did:orgid:%s' % GLIDER_B2B_ORGID
        self.b_ota = Balance(
            orgid=Parser.parse_orgid(self.ota),
            currency=self.currency
        )
        self.b_airline = Balance(
            orgid=Parser.parse_orgid(self.airline),
            currency=self.currency
        )
        self.b_glider_b2b = Balance(
            orgid=Parser.parse_orgid(self.glider_b2b),
            currency=self.currency
        )
        self.ota_agent = '%s#1234' % self.ota
        self.airline_agent = '%s#5678' % self.airline
        self.glider_b2b_agent = '%s#5678' % self.glider_b2b

    def test_simple_payment_flow(self):
        # Check Initial status
        self.assertEqual(self.b_ota.total, Decimal('0.0'))
        self.assertEqual(self.b_airline.total, Decimal('0.0'))

        # The OTA makes a bank transfer and its balance is credited
        s1_uuid = BalanceManager.add_deposit(
            orgid=self.ota,
            agent=self.ota_agent,
            currency=self.currency,
            amount='5000.00',
            source='Initial Deposit'
        )

        s1 = db._database.settlements.find_one({'uuid': s1_uuid})
        self.assertEqual(s1['initiator'], 'Initial Deposit')
        self.assertEqual(s1['beneficiary'], self.b_ota.orgid)
        self.assertEqual(s1['amount'], Decimal128('5000.00'))
        self.assertEqual(s1['currency'], self.currency)
        self.assertEqual(s1['agent'], self.ota_agent)

        # Then the OTA creates a guarantee for the Airline
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('5000.00')

            # Add the guarantee
            g1_uuid = BalanceManager.add_guarantee(
                initiating_orgid=self.ota,
                initiating_agent=self.ota_agent,
                receiving_orgid=self.airline,
                currency=self.currency,
                amount='2500.00',
                expiration='2218-05-25T12:16:14+00:00'
            )

        g1 = db._database.guarantees.find_one({'uuid': g1_uuid})
        self.assertEqual(g1['initiator'], self.b_ota.orgid)
        self.assertEqual(g1['beneficiary'], self.b_airline.orgid)
        self.assertEqual(g1['amount'], Decimal128('2500.00'))
        self.assertEqual(g1['currency'], self.currency)
        self.assertEqual(g1['agent'], self.ota_agent)
        self.assertEqual(g1['claimed'], False)

        # The OTA Verifies the guarantee
        g2 = BalanceManager.get_guarantee(
            orgid=self.b_ota.orgid,
            guarantee_id=g1_uuid
        )
        self.assertEqual(g1['_id'], g2._id)

        # The Airline Verifies the guarantee
        g3 = BalanceManager.get_guarantee(
            orgid=self.b_airline.orgid,
            guarantee_id=g1_uuid
        )
        self.assertEqual(g1['_id'], g3._id)

        # Finally the Airline claims the amount
        s2_uuid = BalanceManager.claim_guarantee(
            claiming_orgid=self.b_airline.orgid,
            claiming_agent=self.airline_agent,
            guarantee_id=g1_uuid
        )

        s2 = db._database.settlements.find_one({'uuid': s2_uuid})
        self.assertEqual(s2['initiator'], self.b_ota.orgid)
        self.assertEqual(s2['beneficiary'], self.b_airline.orgid)
        self.assertEqual(s2['amount'], Decimal128('2500.00'))
        self.assertEqual(s2['currency'], self.currency)
        self.assertEqual(s2['agent'], self.airline_agent)
        self.assertEqual(s2['guarantee'], g1_uuid)

        g2 = Guarantee.from_storage(g1_uuid)
        self.assertEqual(g2.claimed, True)

    def test_credit_withdraw(self):
        # Check Initial status
        self.assertEqual(self.b_ota.total, Decimal('0.0'))
        self.assertEqual(self.b_airline.total, Decimal('0.0'))

        # The OTA withdraw the amount
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the balance
            ma.return_value = Decimal('5000.00')
            with \
                mock.patch('simard.account_manager.AccountManager.get_accounts') \
                    as ga:
                # Redefine the accounts
                account = mock.Mock()
                account.currency = self.currency
                ga.return_value = [account]

                # Perform the withdraw
                s2_uuid = BalanceManager.withdraw(
                    orgid=self.b_ota.orgid,
                    agent=self.ota_agent,
                    currency=self.currency
                )

        s2 = db._database.settlements.find_one({'uuid': s2_uuid})
        self.assertEqual(s2['initiator'], self.b_ota.orgid)
        self.assertEqual(s2['beneficiary'], 'Bank Transfer')
        self.assertEqual(s2['amount'], Decimal128('5000.00'))
        self.assertEqual(s2['currency'], self.currency)
        self.assertEqual(s2['agent'], self.ota_agent)

    def test_credit_withdraw_no_account(self):
        # Check Initial status
        self.assertEqual(self.b_ota.total, Decimal('0.0'))
        self.assertEqual(self.b_airline.total, Decimal('0.0'))

        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the balance
            ma.return_value = Decimal('5000.00')

            # Force account manager to raise an exception
            with \
                mock.patch('simard.account_manager.AccountManager.get_account') \
                    as ga:
                ga.side_effect = AccountManagerException(
                    'Account Not Found',
                    404)

                with self.assertRaises(BalanceManagerException) as ctx:
                    BalanceManager.withdraw(
                        orgid=self.b_ota.orgid,
                        agent=self.ota_agent,
                        currency=self.currency
                    )
                self.assertEqual(ctx.exception.code, 400)
                self.assertEqual(
                    ctx.exception.description,
                    'No recipient account configured to withdraw'
                )

    def test_credit_withdraw_no_balance(self):
        # Check Initial status
        self.assertEqual(self.b_ota.total, Decimal('0.0'))

        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the balance
            ma.return_value = Decimal('0.00')

            with self.assertRaises(BalanceManagerException) as ctx:
                BalanceManager.withdraw(
                    orgid=self.b_ota.orgid,
                    agent=self.ota_agent,
                    currency=self.currency
                )
            self.assertEqual(ctx.exception.code, 400)
            self.assertEqual(
                ctx.exception.description,
                'No available balance to withdraw'
            )

    def test_create_guarantee_no_balance(self):
        """
        A guarantee ca not be created if there is no balance
        """

        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('0.00')

            # Add the guarantee
            with self.assertRaises(BalanceManagerException) as ctx:
                BalanceManager.add_guarantee(
                    initiating_orgid=self.ota,
                    initiating_agent=self.ota_agent,
                    receiving_orgid=self.airline,
                    currency=self.currency,
                    amount='2500.00',
                    expiration='2218-05-25T12:16:14+00:00'
                )
            self.assertEqual(ctx.exception.code, 400)
            self.assertEqual(
                ctx.exception.description,
                'Insufficient balance to create guarantee'
            )

    def test_create_guarantee_insufficient_balance(self):
        """
        A guarantee ca not be created if there is not enough balance
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('99.99')

            # Add the guarantee
            with self.assertRaises(BalanceManagerException) as ctx:
                BalanceManager.add_guarantee(
                    initiating_orgid=self.ota,
                    initiating_agent=self.ota_agent,
                    receiving_orgid=self.airline,
                    currency=self.currency,
                    amount='100.00',
                    expiration='2218-05-25T12:16:14+00:00'
                )
            self.assertEqual(ctx.exception.code, 400)
            self.assertEqual(
                ctx.exception.description,
                'Insufficient balance to create guarantee'
            )

    def test_create_guarantee_for_same_orgid(self):
        """
        A guarantee cannot be created for the same org
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')

            # Add the guarantee
            with self.assertRaises(BalanceManagerException) as ctx:
                BalanceManager.add_guarantee(
                    initiating_orgid=self.ota,
                    initiating_agent=self.ota_agent,
                    receiving_orgid=self.ota,
                    currency=self.currency,
                    amount='100.00',
                    expiration='2218-05-25T12:16:14+00:00'
                )
            self.assertEqual(ctx.exception.code, 400)
            self.assertEqual(
                ctx.exception.description,
                'Can not create a guarantee for the same organization'
            )

    def test_get_guarantee_not_involved(self):
        """
        A guarantee can only be retrieved by the involved parties
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')

            g1_uuid = BalanceManager.add_guarantee(
                initiating_orgid=self.ota,
                initiating_agent=self.ota_agent,
                receiving_orgid=self.airline,
                currency=self.currency,
                amount='100.00',
                expiration='2218-05-25T12:16:14+00:00'
            )

        # Attempt to get the guarantee
        with self.assertRaises(BalanceManagerException) as ctx:
            offender = 'did:orgid:0x%s99' % ('0' * 62)
            BalanceManager.get_guarantee(
                orgid=offender,
                guarantee_id=g1_uuid
            )
        self.assertEqual(ctx.exception.code, 403)
        self.assertEqual(
            ctx.exception.description,
            'Guarantee can only be retrieved by the parties involved'
        )

    def test_get_guarantee_not_found(self):
        """
        A guarantee can only be retrieved if it exists
        """
        # Attempt to get the guarantee
        with self.assertRaises(BalanceManagerGuaranteeNotFoundException) as ctx:
            BalanceManager.get_guarantee(
                orgid=self.ota,
                guarantee_id=str(uuid.uuid4())
            )
        self.assertEqual(ctx.exception.code, 404)
        self.assertEqual(
            ctx.exception.description,
            'Guarantee not found'
        )

    def test_claim_guarantee_not_for_me(self):
        """
        A guarantee can only be claimed if it is for one
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')

            g1_uuid = BalanceManager.add_guarantee(
                initiating_orgid=self.ota,
                initiating_agent=self.ota_agent,
                receiving_orgid=self.airline,
                currency=self.currency,
                amount='100.00',
                expiration='2218-05-25T12:16:14+00:00'
            )

        with self.assertRaises(BalanceManagerException) as ctx:
            BalanceManager.claim_guarantee(
                claiming_orgid=self.ota,
                claiming_agent=self.ota_agent,
                guarantee_id=g1_uuid
            )
        self.assertEqual(ctx.exception.code, 403)
        self.assertEqual(
            ctx.exception.description,
            'The guarantee can only be claimed by the receiving party'
        )

        with self.assertRaises(BalanceManagerException) as ctx:
            offender = 'did:orgid:0x%s99' % ('0' * 62)
            BalanceManager.claim_guarantee(
                claiming_orgid=offender,
                claiming_agent=self.ota_agent,
                guarantee_id=g1_uuid
            )
        self.assertEqual(ctx.exception.code, 403)
        self.assertEqual(
            ctx.exception.description,
            'Guarantee can only be retrieved by the parties involved'
        )

    def test_claim_guarantee_twice(self):
        """
        A guarantee can only be claimed once
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')

            g1_uuid = BalanceManager.add_guarantee(
                initiating_orgid=self.ota,
                initiating_agent=self.ota_agent,
                receiving_orgid=self.airline,
                currency=self.currency,
                amount='100.00',
                expiration='2218-05-25T12:16:14+00:00'
            )

        # Claim the guarantee once
        with mock.patch('simard.balance.Balance.guarantee_claimed') as gc:
            gc.return_value = Decimal('0.0')
            BalanceManager.claim_guarantee(
                claiming_orgid=self.b_airline.orgid,
                claiming_agent=self.airline_agent,
                guarantee_id=g1_uuid
            )

        with mock.patch('simard.balance.Balance.guarantee_claimed') as gc:
            gc.return_value = Decimal('100.0')

            with self.assertRaises(BalanceManagerException) as ctx:
                BalanceManager.claim_guarantee(
                    claiming_orgid=self.b_airline.orgid,
                    claiming_agent=self.airline_agent,
                    guarantee_id=g1_uuid
                )
            self.assertEqual(ctx.exception.code, 400)
            self.assertEqual(
                ctx.exception.description,
                'The guarantee has already been claimed'
            )

    def test_cancel_guarantee_after_expiration(self):
        """
        A guarantee can be canceled after expiration
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:

            # Redefine the return value
            ma.return_value = Decimal('100.00')
            g1_uuid = BalanceManager.add_guarantee(
                initiating_orgid=self.ota,
                initiating_agent=self.ota_agent,
                receiving_orgid=self.airline,
                currency=self.currency,
                amount='100.00',
                expiration='2218-05-25T12:16:14+00:00'
            )

        # Verify that the guarantee is here, and set the date in the past
        g1 = db._database.guarantees.find_one({'uuid': g1_uuid})
        self.assertIsNotNone(g1)

        guarantee = Guarantee.from_storage(g1_uuid)
        guarantee.expiration = dateutil.parser.isoparse(
            '2020-01-01T12:16:14+00:00'
        )
        guarantee.store()

        # Now cancel it
        BalanceManager.cancel_guarantee(
            orgid=self.ota,
            guarantee_id=g1_uuid
        )
        g2 = db._database.guarantees.find_one({'uuid': g1_uuid})
        self.assertIsNone(g2)

    def test_cancel_guarantee_before_expiration(self):
        """
        A guarantee can be canceled before expiration only by beneficiary
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')
            g1_uuid = BalanceManager.add_guarantee(
                initiating_orgid=self.ota,
                initiating_agent=self.ota_agent,
                receiving_orgid=self.airline,
                currency=self.currency,
                amount='100.00',
                expiration='2218-05-25T12:16:14+00:00'
            )

        # OTA Should not be able to cancel it
        with self.assertRaises(BalanceManagerException) as ctx:
            BalanceManager.cancel_guarantee(
                orgid=self.ota,
                guarantee_id=g1_uuid
            )
        g2 = db._database.guarantees.find_one({'uuid': g1_uuid})
        self.assertIsNotNone(g2)
        self.assertEqual(ctx.exception.code, 400)
        self.assertEqual(
            ctx.exception.description,
            'Guarantee cannot be canceled before it expires'
        )

        # Airline should be able to cancel it though
        BalanceManager.cancel_guarantee(
            orgid=self.airline,
            guarantee_id=g1_uuid
        )
        g2 = db._database.guarantees.find_one({'uuid': g1_uuid})
        self.assertIsNone(g2)

    def test_cancel_guarantee_not_mine(self):
        """
        A guarantee can only be canceled by parties
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')
            g1_uuid = BalanceManager.add_guarantee(
                initiating_orgid=self.ota,
                initiating_agent=self.ota_agent,
                receiving_orgid=self.airline,
                currency=self.currency,
                amount='100.00',
                expiration='2218-05-25T12:16:14+00:00'
            )

        # A third party should not be able to cancel it
        with self.assertRaises(BalanceManagerException) as ctx:
            offender = 'did:orgid:0x%s99' % ('0' * 62)
            BalanceManager.cancel_guarantee(
                orgid=offender,
                guarantee_id=g1_uuid
            )
        g2 = db._database.guarantees.find_one({'uuid': g1_uuid})
        self.assertIsNotNone(g2)
        self.assertEqual(ctx.exception.code, 403)
        self.assertEqual(
            ctx.exception.description,
            'Guarantee can only be retrieved by the parties involved'
        )

    def test_virtual_card(self):
        """
        A virtual card creation generates a guarantee to Simard
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')
            card = BalanceManager.generate_virtual_card(
                orgid=self.glider_b2b,
                agent=self.glider_b2b_agent,
                currency=self.currency,
                amount=Decimal('100.00'),
                expiration='2218-05-25T12:16:14+00:00'
            )

        self.assertIsNotNone(card)
        guarantee = Guarantee.from_storage(card.guarantee_id)
        self.assertEqual(guarantee.initiator, self.b_glider_b2b.orgid)
        self.assertEqual(guarantee.beneficiary, VIRTUAL_CARD_ORGID)
        self.assertEqual(guarantee.agent, self.glider_b2b_agent)
        self.assertEqual(
            guarantee.expiration.isoformat(),
            '2218-05-25T12:16:14+00:00'
        )
        self.assertEqual(guarantee.amount, Decimal('100.00'))
        self.assertEqual(guarantee.currency, self.currency)

    def test_virtual_card_no_balance(self):
        """
        A virtual card creation generates a guarantee to Simard
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('75.00')

            with self.assertRaises(BalanceManagerException) as ctx:
                BalanceManager.generate_virtual_card(
                    orgid=self.glider_b2b,
                    agent=self.glider_b2b_agent,
                    currency=self.currency,
                    amount=Decimal('100.00'),
                    expiration='2218-05-25T12:16:14+00:00'
                )
            self.assertEqual(ctx.exception.code, 400)
            self.assertEqual(
                ctx.exception.description,
                'Insufficient balance to create guarantee'
            )

    def test_virtual_card_not_authorized(self):
        """
        A virtual card creation generates a guarantee to Simard
        """

        # Redefine the return value
        with self.assertRaises(BalanceManagerException) as ctx:
            BalanceManager.generate_virtual_card(
                orgid=self.ota,
                agent=self.ota_agent,
                currency=self.currency,
                amount=Decimal('100.00'),
                expiration='2218-05-25T12:16:14+00:00'
            )

        guarantees = db.guarantees.find_one({})
        self.assertEqual(guarantees, None)
        self.assertEqual(ctx.exception.code, 503)

    def test_virtual_card_creation_exception(self):
        """
        The guarantee should be cancelled if the card creation failed
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')

            with mock.patch('simard.virtualcard.VirtualCard.generate') as cg:
                cg.side_effect = Exception('Boom!')

                with self.assertRaises(BalanceManagerException) as ctx:
                    BalanceManager.generate_virtual_card(
                        orgid=self.glider_b2b,
                        agent=self.glider_b2b_agent,
                        currency=self.currency,
                        amount=Decimal('100.00'),
                        expiration='2218-05-25T12:16:14+00:00'
                    )

        guarantees = db.guarantees.find_one({})
        self.assertEqual(guarantees, None)
        self.assertEqual(ctx.exception.code, 500)

    def test_claim_guarantee_with_card(self):
        """
        Test claiming a guarantee and generating a card with the same amount
        """
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')

            g1_uuid = BalanceManager.add_guarantee(
                initiating_orgid=self.ota,
                initiating_agent=self.ota_agent,
                receiving_orgid=self.glider_b2b,
                currency=self.currency,
                amount='100.00',
                expiration='2218-05-25T12:16:14+00:00'
            )

        # Claim the guarantee and generate a virtual card
        virtual_card = VirtualCard(
            account_number='4111111111111111',
            cvv='123',
            currency=self.currency,
            amount=Decimal('100.00'),
            expiration_month='12',
            expiration_year='2020',
            guarantee_id='<to_be_replaced>',
            brand='visa',
            card_type='debit'
        )

        with mock.patch('simard.balance.Balance.available', new_callable=mock.PropertyMock) as ma:
            ma.return_value = Decimal('100.00')
            with mock.patch('simard.balance.Balance.guarantee_claimed') as gc:
                gc.return_value = Decimal('0.0')
                with mock.patch('simard.virtualcard.VirtualCard.generate') as gvcc:
                    gvcc.return_value = virtual_card
                    card, settlement_uuid = BalanceManager.claim_guarantee_with_card(
                        claiming_orgid=self.glider_b2b,
                        claiming_agent=self.glider_b2b_agent,
                        guarantee_id=g1_uuid,
                        card_expiration='2218-05-29T12:16:14.123Z'
                    )

        # Check the settlement is created for OTA > Airline
        s1 = db.settlements.find_one({'uuid': settlement_uuid})
        self.assertIsNotNone(s1)
        self.assertEqual(s1['initiator'], self.b_ota.orgid)
        self.assertEqual(s1['beneficiary'], self.b_glider_b2b.orgid)
        self.assertEqual(s1['amount'], Decimal128('100.00'))
        self.assertEqual(s1['currency'], self.currency)
        self.assertEqual(s1['agent'], self.glider_b2b_agent)
        self.assertEqual(s1['guarantee'], g1_uuid)

        # Retrieve the created guarantee
        (args, kvargs) = gvcc.call_args
        virtual_card.guarantee_id = kvargs['guarantee_id']

        # Check the guarantee is created for Airline > Simard
        g1 = db.guarantees.find_one({'uuid': virtual_card.guarantee_id})
        self.assertIsNotNone(g1)
        self.assertEqual(g1['initiator'], self.b_glider_b2b.orgid)
        self.assertEqual(g1['beneficiary'], VIRTUAL_CARD_ORGID)
        self.assertEqual(g1['amount'], Decimal128('100.00'))
        self.assertEqual(g1['currency'], self.currency)
        self.assertEqual(g1['agent'], self.glider_b2b_agent)
        self.assertEqual(g1['expiration'], '2218-05-29T12:16:14.123000+00:00')

        # FIXME: Cards should be stored in DB before
        # Check the values used for the card creation
        self.assertEqual(kvargs['amount'], Decimal('100.00'))
        self.assertEqual(kvargs['currency'], self.currency)
        self.assertEqual(kvargs['expiration'].isoformat(), '2218-05-29T12:16:14.123000+00:00')

        # Check the value of the generated card object
        self.assertEqual(card.account_number, '4111111111111111')
        self.assertEqual(card.cvv, '123')
        self.assertEqual(card.expiration_month, '12')
        self.assertEqual(card.expiration_year, '2020')
        self.assertEqual(card.brand, 'visa')
        self.assertEqual(card.card_type, 'debit')
        self.assertEqual(card.amount, Decimal('100.00'))
        self.assertEqual(card.currency, self.currency)
        self.assertEqual(card.guarantee_id, virtual_card.guarantee_id)

    def test_virtual_card_generate_and_cancel(self):
        """
        A virtual card creation and cancelation
        """
        # Generate the card
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')
            card = BalanceManager.generate_virtual_card(
                orgid=self.glider_b2b,
                agent=self.glider_b2b_agent,
                currency=self.currency,
                amount=Decimal('100.00'),
                expiration='2218-05-25T12:16:14+00:00'
            )

        self.assertIsNotNone(card)

        # Cancel the card
        BalanceManager.cancel_virtual_card(
            orgid=self.glider_b2b,
            agent=self.glider_b2b_agent,
            guarantee_id=card.guarantee_id
        )

        g = db._database.guarantees.find_one({'uuid': card.guarantee_id})
        self.assertIsNone(g)

    @mock.patch("simard.settlement.GLIDER_OTA_ORGID", GLIDER_OTA_ORGID)
    @mock.patch("simard.settlement.USDC_CONTRACT", USDC_CONTRACT)
    @mock.patch("simard.settlement.USDC_DECIMALS", USDC_DECIMALS)
    @mock.patch("simard.settlement.PAYMENT_MANAGER_CONTRACT", PAYMENT_MANAGER_CONTRACT)
    @mock.patch("simard.settlement.w3", Web3(Web3.WebsocketProvider(ETHEREUM_RPC)))
    @mock.patch("simard.settlement.SIMARD_ORGID", SIMARD_ORGID)
    def test_payment_flow_crypto(self):
        """
        Test for making a payment flow in crypto
        """
        # Check Initial status
        self.assertEqual(self.b_ota.total, Decimal('0.0'))
        self.assertEqual(self.b_airline.total, Decimal('0.0'))

        # The OTA makes a crypto transfer and its balance is credited
        s1_uuid = BalanceManager.add_blockchain_deposit(
            orgid=self.ota,
            agent=self.ota_agent,
            instrument='blockchain',
            chain='ethereum',
            transaction_hash='0x333000000000000000000000000000000000000000000000000000000000a121'
        )

        s1 = db._database.settlements.find_one({'uuid': s1_uuid})
        self.assertEqual(s1['initiator'], self.b_ota.orgid)
        self.assertEqual(s1['beneficiary'], '0x0000000000000000000000000000000000000000000000000000000000009121')
        self.assertEqual(s1['amount'], Decimal128('10'))
        self.assertEqual(s1['currency'], 'USD')
        self.assertEqual(s1['agent'], self.ota_agent)

    def test_swap_basics(self):
        """
        Test for making a quote swap
        """
        # Check Initial status
        self.assertEqual(self.b_ota.total, Decimal('0.0'))
        self.assertEqual(self.b_airline.total, Decimal('0.0'))

        q1 = Quote(
            orgid=self.b_ota.orgid,
            agent=self.ota_agent,
            source_amount=Decimal('100.00'),
            source_currency='EUR',
            target_currency='USD',
        )
        q1.transferwise_id = 12345
        q1.rate = Decimal('0.68')
        q1.target_amount = Decimal('456.68')
        q1.store()

        # Check empty quotes
        with self.assertRaises(BalanceManagerException) as ctx:
            BalanceManager.swap(self.b_ota.orgid, self.ota_agent, None)
        self.assertEqual(ctx.exception.code, 400)

        # Check empty quotes 2
        with self.assertRaises(BalanceManagerException) as ctx:
            BalanceManager.swap(self.b_ota.orgid, self.ota_agent, [])
        self.assertEqual(ctx.exception.code, 400)

        # Check garbage quotes
        with self.assertRaises(ParserException) as ctx:
            BalanceManager.swap(self.b_ota.orgid, self.ota_agent, ['bla'])
        self.assertEqual(ctx.exception.code, 400)

        # Check quote can not be swapped by third party
        with self.assertRaises(QuoteManagerException) as ctx:
            BalanceManager.swap(self.b_airline.orgid, self.ota_agent, [q1.uuid])
        self.assertEqual(ctx.exception.code, 403)

        # Check quote fails when there are no funds
        with self.assertRaises(BalanceManagerException) as ctx:
            BalanceManager.swap(self.b_ota.orgid, self.ota_agent, [q1.uuid])
        self.assertEqual(ctx.exception.code, 400)

        # Check simple quote
        BalanceManager.add_deposit(
            orgid=self.ota,
            agent=self.ota_agent,
            currency=self.currency,
            amount='50.00',
            source='Initial Deposit'
        )

        # Check quote fails when there are insufficient funds
        with self.assertRaises(BalanceManagerException) as ctx:
            BalanceManager.swap(self.b_ota.orgid, self.ota_agent, [q1.uuid])
        self.assertEqual(ctx.exception.code, 400)

        BalanceManager.add_deposit(
            orgid=self.ota,
            agent=self.ota_agent,
            currency=self.currency,
            amount='50.00',
            source='Initial Deposit'
        )

        # Check quote success
        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('100.00')
            s, t = BalanceManager.swap(self.b_ota.orgid, self.ota_agent, [q1.uuid])

            self.assertEqual(len(s), 1)
            self.assertEqual(len(t), 1)

            settlement_source = db._database.settlements.find_one({'uuid': s[0]})
            self.assertEqual(settlement_source['initiator'], self.b_ota.orgid)
            self.assertEqual(settlement_source['beneficiary'], SIMARD_ORGID)
            self.assertEqual(settlement_source['amount'], Decimal128('100.00'))
            self.assertEqual(settlement_source['currency'], 'EUR')
            self.assertEqual(settlement_source['agent'], self.ota_agent)

            settlement_target = db._database.settlements.find_one({'uuid': t[0]})
            self.assertEqual(settlement_target['initiator'], SIMARD_ORGID)
            self.assertEqual(settlement_target['beneficiary'], self.b_ota.orgid)
            self.assertEqual(settlement_target['amount'], Decimal128('456.68'))
            self.assertEqual(settlement_target['currency'], 'USD')
            self.assertEqual(settlement_target['agent'], self.ota_agent)

            self.assertEqual(BalanceManager.get_balance(self.ota, 'EUR').total, Decimal('0.0'))
            self.assertEqual(BalanceManager.get_balance(self.ota, 'USD').total, Decimal('456.68'))
            self.assertTrue(Quote.from_storage(q1.uuid).is_used)

    def test_swap_multiple(self):
        """
        Test for making multiple quote swaps in batch
        """
        # Check Initial status
        self.assertEqual(self.b_ota.total, Decimal('0.0'))
        self.assertEqual(self.b_airline.total, Decimal('0.0'))

        q1 = Quote(
            orgid=self.b_ota.orgid,
            agent=self.ota_agent,
            source_amount=Decimal('100.00'),
            source_currency='EUR',
            target_currency='USD',
        )
        q1.transferwise_id = 12345
        q1.rate = Decimal('0.68')
        q1.target_amount = Decimal('456.68')
        q1.store()

        q2 = Quote(
            orgid=self.b_ota.orgid,
            agent=self.ota_agent,
            source_amount=Decimal('100.00'),
            source_currency='EUR',
            target_currency='USD',
        )
        q2.transferwise_id = 12345
        q2.rate = Decimal('0.68')
        q2.target_amount = Decimal('456.68')
        q2.store()

        q3 = Quote(
            orgid=self.b_ota.orgid,
            agent=self.ota_agent,
            source_amount=Decimal('33.44'),
            source_currency='GBP',
            target_currency='EUR',
        )
        q3.transferwise_id = 12345
        q3.rate = Decimal('0.68')
        q3.target_amount = Decimal('123.67')
        q3.store()

        # Check it fails with insufficient balance
        with self.assertRaises(BalanceManagerException) as ctx:
            BalanceManager.swap(self.b_ota.orgid, self.ota_agent, [q1.uuid, q2.uuid, q3.uuid])
        self.assertEqual(ctx.exception.code, 400)

        BalanceManager.add_deposit(
            orgid=self.ota,
            agent=self.ota_agent,
            currency='EUR',
            amount='190.00',
            source='Initial Deposit'
        )

        BalanceManager.add_deposit(
            orgid=self.ota,
            agent=self.ota_agent,
            currency='GBP',
            amount='190.00',
            source='Initial Deposit'
        )

        with mock.patch(
            'simard.balance.Balance.available',
            new_callable=mock.PropertyMock
        ) as ma:
            # Redefine the return value
            ma.return_value = Decimal('190.00')
            s, t = BalanceManager.swap(self.b_ota.orgid, self.ota_agent, [q1.uuid, q2.uuid, q3.uuid])

            self.assertEqual(len(s), 3)
            self.assertEqual(len(t), 3)

            self.assertEqual(BalanceManager.get_balance(self.ota, 'EUR').total, Decimal('190.0') - Decimal('100') - Decimal('100') + Decimal('123.67'))
            self.assertEqual(BalanceManager.get_balance(self.ota, 'USD').total, Decimal('456.68') + Decimal('456.68'))
            self.assertEqual(BalanceManager.get_balance(self.ota, 'GBP').total, Decimal('190.0') - Decimal('33.44'))
            self.assertTrue(Quote.from_storage(q1.uuid).is_used)
            self.assertTrue(Quote.from_storage(q2.uuid).is_used)
            self.assertTrue(Quote.from_storage(q3.uuid).is_used)
