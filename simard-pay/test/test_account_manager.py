import unittest
from simard.account import Account
from simard.account_manager import AccountManager, AccountManagerException
from simard.db import db
import mongomock
from unittest import mock
import uuid


class TestAccountManager(unittest.TestCase):
    def setUp(self):
        db._database = mongomock.MongoClient().unittest
        self.orgid = '0x0000000000000000000000000000000000000000000000000000000000005121'
        self.agent = 'did:orgid:%s#myAgentKey' % self.orgid
        self.currency = 'EUR'
        self.iban = 'BE71096123456769'

        # A Patcher for the DID Resolver
        resolve_patcher = mock.patch(
            'simard.did_resolver.DidResolver.resolve',
            return_value={
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
        )
        self.resolve_patcher = resolve_patcher.start()
        self.addCleanup(resolve_patcher.stop)

        # A Patcher for the TW POST
        tw_post_patcher = mock.patch('requests.post')
        self.mock_post = tw_post_patcher.start()
        self.mock_post.return_value.json.return_value = {"id": 1234}
        self.mock_post.return_value.status_code = 200
        self.addCleanup(tw_post_patcher.stop)

        # A Patcher for the TW DELETE
        tw_delete_patcher = mock.patch('requests.delete')
        self.mock_delete = tw_delete_patcher.start()
        self.mock_delete.return_value.json.return_value = ""
        self.mock_delete.return_value.status_code = 200
        self.addCleanup(tw_delete_patcher.stop)

    def test_initialization(self):
        """
        Test no accounts are there by default
        """
        self.assertEqual(AccountManager.get_accounts(self.orgid), [])

    def test_retrieve_all_accounts(self):
        """
        Test no accounts are there by default
        """
        a1 = Account(
            orgid=self.orgid,
            agent=self.agent,
            currency=self.currency,
            iban=self.iban
        ).store()
        a2 = Account(
            orgid=self.orgid,
            agent=self.agent,
            currency='CHF',
            iban=self.iban
        ).store()
        accounts = AccountManager.get_accounts(self.orgid)

        self.assertEqual(len(accounts), 2)
        self.assertEqual(accounts[0].uuid, a1.uuid)
        self.assertEqual(accounts[1].uuid, a2.uuid)

    def test_create_account(self):
        account_uuid = AccountManager.create_account(
            orgid=self.orgid,
            agent=self.agent,
            iban=self.iban,
            currency=self.currency
        )

        account = AccountManager.get_account(self.orgid, account_uuid)
        self.assertEqual(account.uuid, account_uuid)
        self.assertEqual(account.currency, self.currency)
        self.assertEqual(account.agent, self.agent)
        self.assertEqual(account.iban, self.iban)
        self.assertEqual(account.transferwise_id, 1234)

    def test_create_account_dupe_currencies(self):
        AccountManager.create_account(
            orgid=self.orgid,
            agent=self.agent,
            iban=self.iban,
            currency=self.currency
        )

        with self.assertRaises(AccountManagerException) as ctx:
            AccountManager.create_account(
                orgid=self.orgid,
                agent=self.agent,
                iban='GB98MIDL07009312345678',
                currency=self.currency
            )
        self.assertEqual(ctx.exception.code, 400)
        self.assertEqual(ctx.exception.description, 'An account already exists with the same currency')

    def test_get_account_does_not_exist(self):
        with self.assertRaises(AccountManagerException) as ctx:
            AccountManager.get_account(
                orgid=self.orgid,
                account_uuid=str(uuid.uuid4())
            )
        self.assertEqual(ctx.exception.code, 404)
        self.assertEqual(ctx.exception.description, 'Account reference not found for the organization')

    def test_get_account_not_mine(self):
        account_uuid = AccountManager.create_account(
            orgid=self.orgid,
            agent=self.agent,
            iban=self.iban,
            currency=self.currency
        )
        with self.assertRaises(AccountManagerException) as ctx:
            AccountManager.get_account(
                orgid='0x%s1' % ('0'*63),
                account_uuid=account_uuid
            )
        self.assertEqual(ctx.exception.code, 404)
        self.assertEqual(ctx.exception.description, 'Account reference not found for the organization')

    def test_update_account(self):
        account_uuid = AccountManager.create_account(
            orgid=self.orgid,
            agent=self.agent,
            iban=self.iban,
            currency=self.currency
        )

        AccountManager.update_account(
            orgid=self.orgid,
            agent=self.agent,
            iban='GB98MIDL07009312345678',
            currency=self.currency,
            account_uuid=account_uuid
        )

        account = AccountManager.get_account(self.orgid, account_uuid)
        self.assertEqual(account.iban, 'GB98MIDL07009312345678')

    def test_update_account_dupe_currencies(self):
        AccountManager.create_account(
            orgid=self.orgid,
            agent=self.agent,
            iban=self.iban,
            currency=self.currency
        )

        account_uuid = AccountManager.create_account(
            orgid=self.orgid,
            agent=self.agent,
            iban=self.iban,
            currency='CHF'
        )

        with self.assertRaises(AccountManagerException) as ctx:
            AccountManager.update_account(
                orgid=self.orgid,
                agent=self.agent,
                iban='GB98MIDL07009312345678',
                currency=self.currency,
                account_uuid=account_uuid
            )
        self.assertEqual(ctx.exception.code, 400)
        self.assertEqual(ctx.exception.description, 'An account already exists with the same currency')

    def test_delete_account(self):
        account_uuid = AccountManager.create_account(
            orgid=self.orgid,
            agent=self.agent,
            iban=self.iban,
            currency=self.currency
        )

        AccountManager.delete_account(self.orgid, account_uuid)

        with self.assertRaises(AccountManagerException) as ctx:
            AccountManager.get_account(self.orgid, account_uuid)

        self.assertEqual(ctx.exception.code, 404)
        self.assertEqual(ctx.exception.description, 'Account reference not found for the organization')

    def test_delete_account_not_mine(self):
        account_uuid = AccountManager.create_account(
            orgid=self.orgid,
            agent=self.agent,
            iban=self.iban,
            currency=self.currency
        )

        with self.assertRaises(AccountManagerException) as ctx:
            AccountManager.delete_account(
                orgid='0x%s1' % ('0'*63),
                account_uuid=account_uuid)

        self.assertEqual(ctx.exception.code, 404)
        self.assertEqual(ctx.exception.description, 'Account reference not found for the organization')

    def test_update_account_not_mine(self):
        account_uuid = AccountManager.create_account(
            orgid=self.orgid,
            agent=self.agent,
            iban=self.iban,
            currency=self.currency
        )

        with self.assertRaises(AccountManagerException) as ctx:
            AccountManager.update_account(
                orgid='0x%s1' % ('0'*63),
                agent=self.agent,
                iban='GB98MIDL07009312345678',
                currency=self.currency,
                account_uuid=account_uuid
            )

        self.assertEqual(ctx.exception.code, 404)
        self.assertEqual(ctx.exception.description, 'Account reference not found for the organization')
