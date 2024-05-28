import unittest
from simard.account import Account
from simard.settings import TRANSFERWISE_API_ENDPOINT
from simard.settings import TRANSFERWISE_API_TOKEN
from simard.settings import TRANSFERWISE_PROFILE_ID
from unittest import mock
from simard.db import db
import mongomock


class TestAccount(unittest.TestCase):
    def setUp(self):
        db._database = mongomock.MongoClient().unittest

        self.iban = 'DE00000000440532013000'

        self.orgid = \
            '0x0000000000000000000000000000000000000000000000000000000000001121'

        self.agent = "did:orgid:%s#myAgentKey" % self.orgid
        self.currency = 'EUR'

        self.a1 = Account(
            orgid=self.orgid,
            agent=self.agent,
            currency=self.currency,
            iban=self.iban
        )

    def test_create_account(self):
        # Create a simple account
        a1 = self.a1
        self.assertEqual(a1.currency, self.currency)
        self.assertEqual(a1.agent, self.agent)
        self.assertEqual(a1.iban, self.iban)
        self.assertEqual(a1.orgid, self.orgid)
        self.assertIsNotNone(a1.uuid)
        self.assertIsNone(a1.transferwise_id)
        self.assertIsNone(a1._id)

    def test_store_retrieve_account(self):
        # Create a simple account
        a1 = self.a1.store()

        # Check the values are updated
        self.assertIsNotNone(a1._id)
        self.assertIsNone(a1.bic)

        # Check the database update
        result = db.accounts.find_one({'uuid': a1.uuid})
        self.assertIsNotNone(result)
        self.assertEqual(result, {
            'uuid': a1.uuid,
            '_id': a1._id,
            'currency': a1.currency,
            'orgid': a1.orgid,
            'iban': a1.iban,
            'agent': self.agent
        })

        a2 = Account.from_storage(a1.uuid)
        self.assertEqual(a2.currency, self.currency)
        self.assertEqual(a2.agent, self.agent)
        self.assertEqual(a2.iban, self.iban)
        self.assertEqual(a2.orgid, self.orgid)
        self.assertEqual(a2.uuid, a1.uuid)
        self.assertIsNone(a1.transferwise_id)
        self.assertEqual(a2._id, a1._id)

    def test_retrieve_multiple_accounts(self):
        a1 = Account(
            orgid="1234",
            agent=self.agent,
            currency='EUR',
            iban=self.iban
        ).store()
        a2 = Account(
            orgid='1234',
            agent=self.agent,
            currency='USD',
            iban=self.iban
        ).store()
        Account(
            orgid='4567',
            agent=self.agent,
            currency='EUR',
            iban=self.iban
        ).store()

        retrieved = Account.retrieve_all_accounts('1234')
        self.assertEqual(len(retrieved), 2)
        self.assertEqual(a1.uuid, retrieved[0].uuid)
        self.assertEqual(a2.uuid, retrieved[1].uuid)
        self.assertEqual(a2._id, retrieved[1]._id)
        self.assertEqual(a2.iban, retrieved[1].iban)
        self.assertEqual(a2.bic, retrieved[1].bic)
        self.assertEqual(a2.agent, retrieved[1].agent)
        self.assertEqual(a2.orgid, retrieved[1].orgid)
        self.assertEqual(a2.currency, retrieved[1].currency)
        self.assertEqual(a2.transferwise_id, retrieved[1].transferwise_id)

    @mock.patch('simard.did_resolver.DidResolver.resolve')
    @mock.patch('requests.post')
    def test_store_transferwise_basic(self, mock_post, mock_resolve):
        """
        Test that we can send an account to Transferwise
        """
        # Simulate the Transferwise Response
        mock_post.return_value.json.return_value = {"id": 1234}
        mock_post.return_value.status_code = 200

        # Simulate the DID Resolver response
        mock_resolve.return_value = {
            'id': self.orgid,
            'didDocument': {
                "legalEntity": {
                    "legalName": "My Super Company",
                    "legalType": "OÜ",
                    "registeredAddress": {
                        "country": "EE",
                        "subdivision": "37",
                        "locality": "Tallinn",
                        "postalCode": "10115",
                        "streetAddress": "Tartu mnt 67/1",
                        "premise": "13b"
                    },
                },
            },
        }

        res = self.a1.create_transferwise_recipient()

        # Check the values
        self.assertTrue(res)
        self.assertEqual(self.a1.transferwise_id, 1234)

        # Check the Mock Call
        mock_post.assert_called_once_with(
            TRANSFERWISE_API_ENDPOINT + '/accounts',
            json={
                'currency': self.currency,
                'ownedByCustomer': False,
                'profile': TRANSFERWISE_PROFILE_ID,
                'details': {
                    'IBAN': self.iban,
                    'legalType': 'BUSINESS',
                    'address': {
                        'country': 'EE',
                        'city': 'Tallinn',
                        'postCode': '10115',
                        'firstLine': '13b, Tartu mnt 67/1'
                    }
                },
                'type': 'iban',
                'accountHolderName': 'My Super Company'
            },
            headers={
                'Authorization': ("Bearer %s" % TRANSFERWISE_API_TOKEN)
            }
        )

    def test_delete_simple(self):
        """
        Test deleting an account
        """
        self.a1.store().delete()
        self.assertEqual(self.a1._id, None)

        result = db.accounts.find_one({'uuid': self.a1.uuid})
        self.assertIsNone(result)

    @mock.patch('simard.did_resolver.DidResolver.resolve')
    @mock.patch('requests.post')
    @mock.patch('requests.delete')
    def test_delete_with_tranferwise(self, mock_delete, mock_post, mock_resolve):
        """
        Test deleting an account
        """
        # Simulate the Transferwise Response
        mock_post.return_value.json.return_value = {"id": 1234}
        mock_post.return_value.status_code = 200

        # Simulate the Transferwise Response
        mock_delete.return_value.text.return_value = ""
        mock_delete.return_value.status_code = 200

        # Simulate the DID Resolver response
        mock_resolve.return_value = {
            'id': self.orgid,
            'didDocument': {
                "legalEntity": {
                    "legalName": "My Super Company",
                    "legalType": "OÜ",
                    "registeredAddress": {
                        "country": "EE",
                        "subdivision": "37",
                        "locality": "Tallinn",
                        "postalCode": "10115",
                        "streetAddress": "Tartu mnt 67/1",
                        "premise": "13b"
                    },
                },
            },
        }

        # Create the account and store in TW
        self.a1.store().create_transferwise_recipient()
        transferwise_id = self.a1.transferwise_id
        self.a1.delete()
        self.assertEqual(self.a1._id, None)
        self.assertEqual(self.a1.transferwise_id, None)

        # CHeck nothing is left in DB
        result = db.accounts.find_one({'uuid': self.a1.uuid})
        self.assertIsNone(result)

        # Check the Mock Call
        mock_delete.assert_called_once_with(
            TRANSFERWISE_API_ENDPOINT + '/accounts/' + str(transferwise_id),
            headers={
                'Authorization': ("Bearer %s" % TRANSFERWISE_API_TOKEN)
            }
        )

    @mock.patch('simard.did_resolver.DidResolver.resolve')
    @mock.patch('requests.post')
    @mock.patch('requests.delete')
    def test_update_account(self, mock_delete, mock_post, mock_resolve):
        """
        Test deleting an account
        """
        # Simulate the Transferwise Response
        mock_post.return_value.json.return_value = {"id": 1234}
        mock_post.return_value.status_code = 200

        # Simulate the Transferwise Response
        mock_delete.return_value.text.return_value = ""
        mock_delete.return_value.status_code = 200

        # Simulate the DID Resolver response
        mock_resolve.return_value = {
            'id': self.orgid,
            'didDocument': {
                "legalEntity": {
                    "legalName": "My Super Company",
                    "legalType": "OÜ",
                    "registeredAddress": {
                        "country": "EE",
                        "subdivision": "37",
                        "locality": "Tallinn",
                        "postalCode": "10115",
                        "streetAddress": "Tartu mnt 67/1",
                        "premise": "13b"
                    },
                },
            },
        }

        # Create the account, modify and re-store
        self.a1.store().create_transferwise_recipient()
        self.a1.iban = 'IL620108000000099999999'
        self.a1.store().create_transferwise_recipient()

        result = db.accounts.find_one({'uuid': self.a1.uuid})
        self.assertIsNotNone(result)
        self.assertEqual(self.a1.iban, result['iban'])
