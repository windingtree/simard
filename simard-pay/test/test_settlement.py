from unittest import TestCase
from simard.settlement import Settlement, SettlementException
from simard.guarantee import Guarantee
from decimal import Decimal
from bson.decimal128 import Decimal128
from simard.db import db
import mongomock
import uuid
from unittest import mock
from web3 import Web3
from simard.quote import Quote

ETHEREUM_RPC = 'wss://ropsten.infura.io/ws/v3/2fd62c57b57e4f27b8d6909d07c2b6d1'
PAYMENT_MANAGER_CONTRACT = '0x0000000000000000000000000000000000099338'
USDC_CONTRACT = '0x0000000000000000000000000000000000099337'
USDC_DECIMALS = '6'
SIMARD_ORGID = '0x0000000000000000000000000000000000000000000000000000000000003121'
GLIDER_OTA_ORGID = '0x0000000000000000000000000000000000000000000000000000000000007121'

@mock.patch("simard.settlement.SIMARD_ORGID", SIMARD_ORGID)
@mock.patch("simard.settlement.GLIDER_OTA_ORGID", GLIDER_OTA_ORGID)
@mock.patch("simard.settlement.USDC_CONTRACT", USDC_CONTRACT)
@mock.patch("simard.settlement.USDC_DECIMALS", USDC_DECIMALS)
@mock.patch("simard.settlement.PAYMENT_MANAGER_CONTRACT", PAYMENT_MANAGER_CONTRACT)
@mock.patch("simard.settlement.w3", Web3(Web3.WebsocketProvider(ETHEREUM_RPC)))
class SettlementTest(TestCase):
    def setUp(self):
        db._database = mongomock.MongoClient().unittest
        db._database.settlements.drop()
        db._database.quotes.drop()

        self.g1_initiator = "1234"
        self.g1_beneficiary = "4567"
        self.g1_amount = Decimal('300.45')
        self.g1_currency = "EUR"
        self.g1_agent = "myAgent"
        self.g1_id = "5e5910b71aa85b667b20e4d6"

        self.g1 = Settlement(
            initiator=self.g1_initiator,
            beneficiary=self.g1_beneficiary,
            amount=self.g1_amount,
            currency=self.g1_currency,
            agent=self.g1_agent,
        )

    def test_init(self):
        """
        Test that all values are properly instantiated
        """
        self.assertEqual(self.g1.initiator, self.g1_initiator)
        self.assertEqual(self.g1.beneficiary, self.g1_beneficiary)
        self.assertEqual(self.g1.amount, self.g1_amount)
        self.assertEqual(self.g1.currency, self.g1_currency)
        self.assertEqual(self.g1.agent, self.g1_agent)
        self.assertIsNone(self.g1._id)
        self.assertRegex(
            str(self.g1.uuid),
            '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$'
        )

    def test_store_initial(self):
        """
        Test that that a guarantee is stored during initial creation
        """
        db.settlements.drop()
        # Call the storage
        self.g1.store()

        # Check all values are here
        self.assertIsNotNone(self.g1._id)
        stored = db.settlements.find_one({'_id': self.g1._id})
        self.assertDictEqual(stored, {
            '_id': self.g1._id,
            'initiator': self.g1.initiator,
            'beneficiary': self.g1.beneficiary,
            'amount': Decimal128(self.g1.amount),
            'currency': self.g1.currency,
            'agent': self.g1.agent,
            'uuid': self.g1.uuid
        })
        db.settlements.drop()

    def test_init_from_storage(self):
        """
        Test that that a guarantee can be retrieved from storage
        """
        #  Clean the state
        db.settlements.drop()
        self.g1.store()

        # Call the storage
        g = Settlement.from_storage(self.g1.uuid)

        # Check the values
        self.assertEqual(g.initiator, self.g1_initiator)
        self.assertEqual(g.beneficiary, self.g1_beneficiary)
        self.assertEqual(g.amount, self.g1_amount)
        self.assertEqual(g.currency, self.g1_currency)
        self.assertEqual(g.agent, self.g1_agent)
        self.assertEqual(g.uuid, self.g1.uuid)
        self.assertEqual(g._id, self.g1._id)

        # Clean
        db.settlements.drop()

    def test_init_from_storage_none(self):
        self.assertIsNone(Settlement.from_storage(uuid.uuid4()))

    def test_init_from_guarantee_full(self):
        """
        Test that that a guarantee can be retrieved from storage
        """
        # Create a guarantee
        guarantee = Guarantee(
            initiator=self.g1_initiator,
            beneficiary=self.g1_beneficiary,
            amount=self.g1_amount,
            currency=self.g1_currency,
            expiration='tommorow',
            agent=self.g1_agent,
        )

        # Initialize the settlement
        s = Settlement.from_guarantee(guarantee=guarantee, agent=self.g1_agent)

        # Check the values
        self.assertEqual(s.initiator, self.g1_initiator)
        self.assertEqual(s.beneficiary, self.g1_beneficiary)
        self.assertEqual(s.amount, self.g1_amount)
        self.assertEqual(s.currency, self.g1_currency)
        self.assertEqual(s.agent, self.g1_agent)
        self.assertIsNone(s._id)
        self.assertRegex(
            str(s.uuid),
            '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$'
        )

    def test_init_from_guarantee_partial(self):
        """
        Test that a settlement can be created for a partial amount
        """
        # Create a guarantee
        guarantee = Guarantee(
            initiator=self.g1_initiator,
            beneficiary=self.g1_beneficiary,
            amount=2 * self.g1_amount,
            currency=self.g1_currency,
            expiration='tommorow',
            agent=self.g1_agent,
        )

        # Initialize the settlement
        s = Settlement.from_guarantee(
            guarantee=guarantee,
            agent=self.g1_agent,
            amount=self.g1_amount
        )

        # Check the values
        self.assertEqual(s.guarantee_uuid, guarantee.uuid)
        self.assertEqual(s.initiator, self.g1_initiator)
        self.assertEqual(s.beneficiary, self.g1_beneficiary)
        self.assertEqual(s.amount, self.g1_amount)
        self.assertEqual(s.currency, self.g1_currency)
        self.assertEqual(s.agent, self.g1_agent)
        self.assertIsNone(s._id)
        self.assertRegex(
            str(s.uuid),
            '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$'
        )

        # Store the value
        s.store()

        # Verify the stored values
        self.assertIsNotNone(s._id)
        stored = db.settlements.find_one({'_id': s._id})
        self.assertDictEqual(stored, {
            '_id': s._id,
            'initiator': self.g1.initiator,
            'beneficiary': self.g1.beneficiary,
            'amount': Decimal128(self.g1.amount),
            'currency': self.g1.currency,
            'guarantee': guarantee.uuid,
            'agent': self.g1.agent,
            'uuid': s.uuid,
            'source': 'guarantee',
        })

        # Verify we can retrieve the guarantee ID when retrieving from storage
        s2 = Settlement.from_storage(s.uuid)
        self.assertEqual(s2.guarantee_uuid, s.guarantee_uuid)

    def test_init_from_guarantee_partial_exceed(self):
        """
        Test that a settlement amount does not exceed guarantee amount
        """
        guarantee = Guarantee(
            initiator=self.g1_initiator,
            beneficiary=self.g1_beneficiary,
            amount=self.g1_amount,
            currency=self.g1_currency,
            expiration='tommorow',
            agent=self.g1_agent,
        )

        with self.assertRaises(SettlementException):
            Settlement.from_guarantee(
                guarantee=guarantee,
                agent=self.g1_agent,
                amount=2 * self.g1_amount
            )

    def test_init_from_blockchain(self):
        """
        Test that a settlement from blockchain is working
        TODO: Make the test using mocks
        """
        s1 = Settlement.from_blockchain_deposit(
            orgid=self.g1_initiator,
            agent=self.g1_agent,
            transaction_hash='0x333000000000000000000000000000000000000000000000000000000000a121',
        )
        self.assertEqual(s1.amount, Decimal(10))
        self.assertEqual(s1.currency, 'USD')
        self.assertEqual(s1.beneficiary, '0x0000000000000000000000000000000000000000000000000000000000009121')
        self.assertEqual(s1.initiator, self.g1_initiator)
        self.assertEqual(s1.source, 'ethereum')
        self.assertEqual(s1.agent, self.g1_agent)

    def test_from_blockchain_invalid_hash(self):
        """
        Test that a settlement from blockchain is working
        TODO: Make the test using mocks
        """
        with self.assertRaises(SettlementException) as ctx:
            Settlement.from_blockchain_deposit(
                orgid=self.g1_initiator,
                agent=self.g1_agent,
                transaction_hash='0x444000000000000000000000000000000000000000000000000000000000a121',
            )
        self.assertEqual(ctx.exception.code, 400)
        self.assertEqual(ctx.exception.description, 'Transaction Hash: Not found')

    def test_from_blockchain_irrelevant_hash(self):
        """
        Test that a settlement from blockchain is working
        TODO: Make the test using mocks
        """
        with self.assertRaises(SettlementException) as ctx:
            Settlement.from_blockchain_deposit(
                orgid=self.g1_initiator,
                agent=self.g1_agent,
                transaction_hash='0x555000000000000000000000000000000000000000000000000000000000a121',
            )
        self.assertEqual(ctx.exception.code, 400)
        self.assertEqual(ctx.exception.description, 'Transaction Hash: No payment logs found')

    def test_init_from_blockchain_with_quote(self):
        """
        Test that a settlement from blockchain is working
        TODO: Make the test using mocks
        """
        # Create a quote, simulating transferwise process
        q = Quote(
            orgid=self.g1_initiator,
            agent=self.g1_agent,
            source_amount=Decimal(10),
            source_currency='USD',
            target_currency=self.g1_currency
        )
        q.target_amount = self.g1_amount

        # Create the settlement
        s1 = Settlement.from_blockchain_deposit(
            orgid=self.g1_initiator,
            agent=self.g1_agent,
            transaction_hash='0x333000000000000000000000000000000000000000000000000000000000a121',
            quote=q,
        )
        self.assertEqual(s1.amount, self.g1_amount)
        self.assertEqual(s1.currency, self.g1_currency)
        self.assertEqual(s1.beneficiary, '0x0000000000000000000000000000000000000000000000000000000000009121')
        self.assertEqual(s1.initiator, self.g1_initiator)
        self.assertEqual(s1.source, 'ethereum')
        self.assertEqual(s1.agent, self.g1_agent)

    def test_init_from_blockchain_invalid_quote_currency(self):
        """
        Test that a settlement from blockchain is working
        TODO: Make the test using mocks
        """
        # Create a quote, simulating transferwise process
        q = Quote(
            orgid=self.g1_initiator,
            agent=self.g1_agent,
            source_amount=Decimal(10),
            source_currency='EUR',
            target_currency='RUB'
        )
        q.target_amount = self.g1_amount

        # Create the settlement
        with self.assertRaises(SettlementException) as ctx:
            Settlement.from_blockchain_deposit(
                orgid=self.g1_initiator,
                agent=self.g1_agent,
                transaction_hash='0x333000000000000000000000000000000000000000000000000000000000a121',
                quote=q,
            )
        self.assertEqual(ctx.exception.code, 400)

    def test_init_from_blockchain_invalid_quote_amount(self):
        """
        Test that a settlement from blockchain is working
        TODO: Make the test using mocks
        """
        # Create a quote, simulating transferwise process
        q = Quote(
            orgid=self.g1_initiator,
            agent=self.g1_agent,
            source_amount=Decimal(10) + Decimal('0.01'),
            source_currency='USD',
            target_currency=self.g1_currency
        )
        q.target_amount = self.g1_amount

        # Create the settlement
        with self.assertRaises(SettlementException) as ctx:
            Settlement.from_blockchain_deposit(
                orgid=self.g1_initiator,
                agent=self.g1_agent,
                transaction_hash='0x333000000000000000000000000000000000000000000000000000000000a121',
                quote=q,
            )
        self.assertEqual(ctx.exception.code, 400)

    def test_init_from_blockchain_invalid_quote_owner(self):
        """
        Test that a settlement from blockchain is working
        TODO: Make the test using mocks
        """
        # Create a quote, simulating transferwise process
        q = Quote(
            orgid='12345',
            agent=self.g1_agent,
            source_amount=Decimal(10),
            source_currency='USD',
            target_currency=self.g1_currency
        )
        q.target_amount = self.g1_amount

        # Create the settlement
        with self.assertRaises(SettlementException) as ctx:
            Settlement.from_blockchain_deposit(
                orgid=self.g1_initiator,
                agent=self.g1_agent,
                transaction_hash='0x333000000000000000000000000000000000000000000000000000000000a121',
                quote=q,
            )
        self.assertEqual(ctx.exception.code, 403)
