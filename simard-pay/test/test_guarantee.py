from unittest import TestCase
from simard.guarantee import Guarantee
from decimal import Decimal
from bson.decimal128 import Decimal128
from simard.db import db
import mongomock
import uuid
from datetime import datetime, timezone


class GuaranteeTest(TestCase):
    def setUp(self):
        # Override database with mock
        db._database = mongomock.MongoClient().unittest

        self.g1_initiator = "1234"
        self.g1_beneficiary = "4567"
        self.g1_amount = Decimal('300.45')
        self.g1_currency = "EUR"
        self.g1_expiration = datetime.now(timezone.utc)
        self.g1_agent = "myAgent"
        self.g1_id = "5e5910b71aa85b667b20e4d6"

        self.g1 = Guarantee(
            initiator=self.g1_initiator,
            beneficiary=self.g1_beneficiary,
            amount=self.g1_amount,
            currency=self.g1_currency,
            expiration=self.g1_expiration,
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
        self.assertEqual(self.g1.expiration, self.g1_expiration)
        self.assertEqual(self.g1.agent, self.g1_agent)
        self.assertIsNone(self.g1._id)
        self.assertFalse(self.g1.claimed)
        self.assertRegex(
            str(self.g1.uuid),
            '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$'
        )

    def test_store_initial(self):
        """
        Test that that a guarantee is stored during initial creation
        """
        db.guarantees.drop()
        # Call the storage
        self.g1.store()

        # Check all values are here
        self.assertIsNotNone(self.g1._id)
        stored = db.guarantees.find_one({'_id': self.g1._id})
        self.assertDictEqual(stored, {
            '_id': self.g1._id,
            'initiator': self.g1.initiator,
            'beneficiary': self.g1.beneficiary,
            'claimed': False,
            'amount': Decimal128(self.g1.amount),
            'currency': self.g1.currency,
            'expiration': self.g1.expiration.isoformat(),
            'agent': self.g1.agent,
            'uuid': self.g1.uuid
        })
        db.guarantees.drop()

    def test_init_from_storage(self):
        """
        Test that that a guarantee can be retrieved from storage
        """
        #  Clean the state
        db.guarantees.drop()
        self.g1.store()

        # Call the storage
        g = Guarantee.from_storage(self.g1.uuid)

        # Check the values
        self.assertEqual(g.initiator, self.g1_initiator)
        self.assertEqual(g.beneficiary, self.g1_beneficiary)
        self.assertEqual(g.amount, self.g1_amount)
        self.assertEqual(g.currency, self.g1_currency)
        self.assertEqual(g.expiration, self.g1_expiration)
        self.assertEqual(g.agent, self.g1_agent)
        self.assertEqual(g.uuid, self.g1.uuid)
        self.assertEqual(g._id, self.g1._id)
        self.assertEqual(g.claimed, False)

        # Clean
        db.guarantees.drop()

    def test_init_from_storage_none(self):
        self.assertIsNone(Guarantee.from_storage(uuid.uuid4()))

    def test_init_from_storage_claimed(self):
        """
        Test that that a guarantee can be retrieved from storage
        """
        #  Clean the state
        db.guarantees.drop()
        self.g1.store()
        self.g1.flag_claimed()

        # Call the storage
        g = Guarantee.from_storage(self.g1.uuid)

        # Check the values
        self.assertEqual(g.initiator, self.g1_initiator)
        self.assertEqual(g.beneficiary, self.g1_beneficiary)
        self.assertEqual(g.amount, self.g1_amount)
        self.assertEqual(g.currency, self.g1_currency)
        self.assertEqual(g.expiration, self.g1_expiration)
        self.assertEqual(g.agent, self.g1_agent)
        self.assertEqual(g.uuid, self.g1.uuid)
        self.assertEqual(g._id, self.g1._id)
        self.assertEqual(g.claimed, True)

        # Clean
        db.guarantees.drop()
