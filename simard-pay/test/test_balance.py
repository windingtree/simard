from unittest import TestCase
from simard.balance import Balance
from simard.settlement import Settlement
from simard.guarantee import Guarantee
from decimal import Decimal
from simard.db import db
from unittest import mock
import mongomock
from bson.decimal128 import Decimal128
import dateutil.parser


# 2020-03-03: Aggregate function needs to be manually patched
# Since the mongomock v3.19 $sum does not work with Decimals
def get_mock_credit_aggregate(operations, currency, beneficiary):
    total = Decimal()
    for s in operations:
        if s.currency == currency and s.beneficiary == beneficiary:
            total += s.amount
    return [{'total': Decimal128(total), '_id': currency}]


def get_mock_debit_aggregate(operations, currency, initiator):
    total = Decimal()
    for s in operations:
        if s.currency == currency and s.initiator == initiator:
            total += s.amount
    return [{'total': Decimal128(total), '_id': currency}]


def get_credit_aggregate_pipeline(currency, beneficiary):
    return [
        {
            # Match object
            '$match': {
                'currency': currency,
                'beneficiary': beneficiary
            }
        }, {
            # Group object
            '$group': {
                '_id': '$currency',
                'total': {
                    '$sum': '$amount'
                },
            }
        }]


def get_debit_aggregate_pipeline(currency, initiator):
    return [
        # Match object
        {
            '$match': {
                'currency': currency,
                'initiator': initiator
            }
        },

        # Group object
        {
            '$group': {
                '_id': '$currency',
                'total': {
                    '$sum': '$amount'
                },
            }
        },
    ]


class BalanceTest(TestCase):
    def setUp(self):
        db._database = mongomock.MongoClient().unittest
        db.settlements.drop()
        db.guarantees.drop()

        self.g1_initiator = "1234"
        self.g1_beneficiary = "4567"
        self.g1_amount = Decimal('300.45')
        self.g1_currency = "EUR"
        self.g1_agent = "myAgent"
        self.g1_id = "5e5910b71aa85b667b20e4d6"
        self.g1_expiration = '2019-10-20'

        self.beneficiary_balance = Balance(
            self.g1_beneficiary,
            self.g1_currency
        )
        self.initiator_balance = Balance(
            self.g1_initiator,
            self.g1_currency
        )

    def test_balance_empty(self):
        """
        Test computing a balance that received nothing
        """
        self.assertEqual(self.beneficiary_balance.total, Decimal('0.0'))
        self.assertEqual(self.initiator_balance.total, Decimal('0.0'))

    def test_balance_credit_two_deposits(self):
        """
        Test computing a balance that received two deposits
        """
        # Setup the DB
        db.settlements.drop()
        settlements = [
            Settlement(
                initiator=self.g1_initiator,
                beneficiary=self.g1_beneficiary,
                amount=self.g1_amount,
                currency=self.g1_currency,
                agent=self.g1_agent,
            ).store(),
            Settlement(
                initiator=self.g1_initiator,
                beneficiary=self.g1_beneficiary,
                amount=self.g1_amount,
                currency=self.g1_currency,
                agent=self.g1_agent,
            ).store()
        ]

        # Verify the credit
        with mock.patch("mongomock.collection.Collection.aggregate") as ma:
            ma.return_value = get_mock_credit_aggregate(
                operations=settlements,
                currency=self.g1_currency,
                beneficiary=self.g1_beneficiary
            )

            # Verify beneficiary balance
            self.assertEqual(self.beneficiary_balance.credit, 2 * self.g1_amount)

            # Verify the call
            ma.assert_called_once_with(
                get_credit_aggregate_pipeline(
                    currency=self.g1_currency,
                    beneficiary=self.g1_beneficiary
                )
            )

        # Verify the debit
        with mock.patch("mongomock.collection.Collection.aggregate") as ma:
            ma.return_value = get_mock_debit_aggregate(
                operations=settlements,
                currency=self.g1_currency,
                initiator=self.g1_initiator
            )

            # Verify beneficiary balance
            self.assertEqual(self.initiator_balance.debit, 2 * self.g1_amount)

            # Verify the call
            ma.assert_called_once_with(
                get_debit_aggregate_pipeline(
                    currency=self.g1_currency,
                    initiator=self.g1_initiator
                )
            )

    def test_balance_credit_deposits_different_currency(self):
        """
        Test computing a balance that received deposits in different currencies
        """
        # Setup the DB
        db.settlements.drop()
        settlements = [
            Settlement(
                initiator=self.g1_initiator,
                beneficiary=self.g1_beneficiary,
                amount=self.g1_amount,
                currency=self.g1_currency,
                agent=self.g1_agent,
            ).store(),
            Settlement(
                initiator=self.g1_initiator,
                beneficiary=self.g1_beneficiary,
                amount=3 * self.g1_amount,
                currency='USD',
                agent=self.g1_agent,
            ).store()
        ]

        # Check the first currency
        with mock.patch("mongomock.collection.Collection.aggregate") as ma:
            ma.return_value = get_mock_credit_aggregate(
                operations=settlements,
                currency=self.g1_currency,
                beneficiary=self.g1_beneficiary
            )

            # Verify beneficiary balance
            self.assertEqual(self.beneficiary_balance.credit, self.g1_amount)

            # Verify the call
            ma.assert_called_once_with(
                get_credit_aggregate_pipeline(
                    currency=self.g1_currency,
                    beneficiary=self.g1_beneficiary
                )
            )

        # Check the second currency
        with mock.patch("mongomock.collection.Collection.aggregate") as ma:
            ma.return_value = get_mock_credit_aggregate(
                operations=settlements,
                currency='USD',
                beneficiary=self.g1_beneficiary
            )

            # Verify beneficiary balance
            self.assertEqual(self.beneficiary_balance.credit, 3 * self.g1_amount)

            # Verify the call
            ma.assert_called_once_with(
                get_credit_aggregate_pipeline(
                    currency=self.g1_currency,
                    beneficiary=self.g1_beneficiary
                )
            )

    def test_balance_credit_then_debit(self):
        """
        Test computing a balance that received same credit and debit
        """
        # Setup the DB
        db.settlements.drop()
        settlements = [
            Settlement(
                initiator=self.g1_initiator,
                beneficiary=self.g1_beneficiary,
                amount=self.g1_amount,
                currency=self.g1_currency,
                agent=self.g1_agent,
            ).store(),
            Settlement(
                initiator=self.g1_beneficiary,
                beneficiary=self.g1_initiator,
                amount=self.g1_amount,
                currency=self.g1_currency,
                agent=self.g1_agent,
            ).store()
        ]

        # Check the first currency
        with mock.patch("mongomock.collection.Collection.aggregate") as ma:
            ma.side_effect = [
                get_mock_credit_aggregate(
                    operations=settlements,
                    currency=self.g1_currency,
                    beneficiary=self.g1_beneficiary
                ),
                get_mock_debit_aggregate(
                    operations=settlements,
                    currency=self.g1_currency,
                    initiator=self.g1_beneficiary
                )
            ]

            # Verify beneficiary balance
            self.assertEqual(self.beneficiary_balance.total, Decimal('0.0'))

    def test_guarantee_scenario(self):
        """
        Test computing a balance with settlements and guarantees
        """
        # Setup the DB
        db.settlements.drop()
        db.guarantees.drop()
        settlements = [
            Settlement(
                initiator='did:orgid:faucet',
                beneficiary='did:orgid:ota',
                amount=Decimal('100.00'),
                currency='EUR',
                agent='bob',
            ).store(),
        ]
        guarantees = [
            Guarantee(
                initiator='did:orgid:ota',
                beneficiary='did:orgid:supplier',
                amount=Decimal('75.00'),
                currency='EUR',
                expiration=dateutil.parser.isoparse(
                    '2020-01-01T12:16:14+00:00'),
                agent='bob',
            ).store(),
        ]

        # Check the amount reserved
        with mock.patch("mongomock.collection.Collection.aggregate") as ma:
            ma.side_effect = [
                get_mock_debit_aggregate(
                    operations=guarantees,
                    currency='EUR',
                    initiator='did:orgid:ota'
                ),
                Exception('Too many calls')
            ]

            # Verify beneficiary balance
            self.assertEqual(
                Balance(orgid='did:orgid:ota', currency='EUR').reserved,
                Decimal('75.0')
            )

        # Check the amount claimable
        with mock.patch("mongomock.collection.Collection.aggregate") as ma:
            ma.side_effect = [
                get_mock_credit_aggregate(
                    operations=guarantees,
                    currency='EUR',
                    beneficiary='did:orgid:supplier'
                ),
                Exception('Too many calls')
            ]

            # Verify beneficiary balance
            self.assertEqual(
                Balance(orgid='did:orgid:supplier', currency='EUR').claimable,
                Decimal('75.0')
            )

        # Check the amount available
        with mock.patch("mongomock.collection.Collection.aggregate") as ma:
            ma.side_effect = [
                get_mock_credit_aggregate(
                    operations=settlements,
                    currency='EUR',
                    beneficiary='did:orgid:ota'
                ),
                get_mock_debit_aggregate(
                    operations=settlements,
                    currency='EUR',
                    initiator='did:orgid:ota'
                ),
                get_mock_debit_aggregate(
                    operations=guarantees,
                    currency='EUR',
                    initiator='did:orgid:ota'
                ),
                Exception('Too many calls')
            ]

            # Verify beneficiary balance
            self.assertEqual(
                Balance(orgid='did:orgid:ota', currency='EUR').available,
                Decimal('25.0')
            )

    def test_guarantee_claimable_scenario(self):
        # Initial test setup
        db.settlements.drop()
        db.guarantees.drop()

        # The OTA makes an initial deposit
        Settlement(
            initiator='did:orgid:faucet',
            beneficiary='did:orgid:ota',
            amount=Decimal('100.00'),
            currency='EUR',
            agent='bob',
        ).store()

        # The OTA makes two guarantees
        g1 = Guarantee(
            initiator='did:orgid:ota',
            beneficiary='did:orgid:supplier1',
            amount=Decimal('15.77'),
            currency='EUR',
            expiration=dateutil.parser.isoparse(
                '2020-01-01T12:16:14+00:00'),
            agent='bob',
        ).store()

        Guarantee(
            initiator='did:orgid:ota',
            beneficiary='did:orgid:supplier2',
            amount=Decimal('22.00'),
            currency='EUR',
            expiration=dateutil.parser.isoparse(
                '2020-01-01T12:16:14+00:00'),
            agent='bob',
        ).store()

        # Suplier 1 claims a partial amount
        s1 = Settlement.from_guarantee(
            guarantee=g1,
            agent='alice',
            amount=Decimal('8.50')
        ).store()
        s2 = Settlement.from_guarantee(
            guarantee=g1,
            agent='alice',
            amount=Decimal('6.50')
        ).store()

        # Check the amount still claimable by supplier #1
        with mock.patch("mongomock.collection.Collection.aggregate") as ma:
            # Compute the value
            total = s1.amount + s2.amount
            ma.return_value = [{'total': Decimal128(total), '_id': 'EUR'}]

            # Retrieve the balance
            b = Balance('did:orgid:supplier1', 'EUR')
            self.assertEqual(
                b.guarantee_claimed(g1.uuid),
                total
            )

            # Check the aggregate query
            ma.assert_called_once_with([
                # Match object
                {
                    '$match': {
                        'currency': 'EUR',
                        'beneficiary': 'did:orgid:supplier1',
                        'guarantee': g1.uuid
                    }
                },

                # Group object
                {
                    '$group': {
                        '_id': '$currency',
                        'total': {
                            '$sum': '$amount'
                        },
                    }
                },
            ])

    def test_retrieve_all_balances(self):
        """
        Test that we can create aggregate on multiple currencies
        """
        # Initially it should be empty
        res0 = Balance.retrieve_all('did:orgid:ota')
        self.assertEqual(res0, [])

        # Create a deposit
        Settlement(
            initiator='did:orgid:faucet',
            beneficiary='did:orgid:ota',
            amount=Decimal('100.00'),
            currency='EUR',
            agent='bob',
        ).store()

        res1 = Balance.retrieve_all('did:orgid:ota')
        self.assertEqual(len(res1), 1)
        self.assertEqual(res1[0].orgid, 'did:orgid:ota')
        self.assertEqual(res1[0].currency, 'EUR')

        # Adding a deposit in same currency should not change
        Settlement(
            initiator='did:orgid:faucet',
            beneficiary='did:orgid:ota',
            amount=Decimal('10.00'),
            currency='EUR',
            agent='bob',
        ).store()

        res2 = Balance.retrieve_all('did:orgid:ota')
        self.assertEqual(len(res2), 1)

        # Adding a deposit in other currency should change
        Settlement(
            initiator='did:orgid:faucet',
            beneficiary='did:orgid:ota',
            amount=Decimal('10.00'),
            currency='USD',
            agent='bob',
        ).store()

        res3 = Balance.retrieve_all('did:orgid:ota')
        self.assertEqual(len(res3), 2)
