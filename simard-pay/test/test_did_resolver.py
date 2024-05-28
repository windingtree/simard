import unittest
from unittest import mock
from simard.did_resolver import DidResolver, DidResolverException
from simard.w3 import w3
import binascii
import json


class TestDidResolver(unittest.TestCase):
    def setUp(self):
        self.orgId = \
            '5e6994f76764ceb42c476a2505065a6170178a24c03d81c9f372563830001171'
        self.did = "did:orgid:0x%s" % self.orgId
        self.exists = True
        self.orgJsonUri = \
            '/'.join([
                'https://gist.githubusercontent.com',
                'kostysh',
                'ce05b47edbe11c7902d99733c517f7d7',
                'raw',
                'b35e009cfbb9d7e35f21cce0fd4d1cc6e4082b84',
                'Simard%2520ORG.ID'
            ])
        self.orgJsonHash = \
            '863058849040745206130c075a4abe36584cc101312b47c7a2a746237d5e3f67'
        self.parentOrgId = '0' * 64
        self.owner = '0x0000000000000000000000000000000000099341'
        self.director = '0x0000000000000000000000000000000000000000'
        self.isActive = True
        self.isDirectorshipAccepted = False

    def test_get_onchain_organization(self):
        """
        Test that we can get the on-chain data
        """
        with mock.patch('web3.contract.ContractCaller') as c:
            # Mock the ethereum webcall
            c.return_value.getOrganization.return_value = (
                self.exists,
                binascii.unhexlify(self.orgId),
                binascii.unhexlify(self.orgJsonHash),
                self.orgJsonUri,
                '',
                '',
                binascii.unhexlify(self.parentOrgId),
                self.owner,
                self.director,
                self.isActive,
                self.isDirectorshipAccepted
            )

            # Make the call to resolve
            o = DidResolver.get_onchain_organization(self.did)

        # Check the values
        self.assertEqual(o.exists, self.exists)
        self.assertEqual(o.orgId.hex(), self.orgId)
        self.assertEqual(o.orgJsonUri, self.orgJsonUri)
        self.assertEqual(o.orgJsonHash.hex(), self.orgJsonHash)
        self.assertEqual(o.parentOrgId.hex(), self.parentOrgId)
        self.assertEqual(o.owner, self.owner)
        self.assertEqual(o.director, self.director)
        self.assertEqual(o.isActive, self.isActive)
        self.assertEqual(o.isDirectorshipAccepted, self.isDirectorshipAccepted)

    def test_get_offchain_document_http(self):
        """
        Test to retrieve a document
        """
        # Simulate the HTTP answer
        with mock.patch('requests.get') as g:
            g.return_value.text = '<dummy>'
            dummy_hash = bytes(w3.sha3(g.return_value.text))

            doc = DidResolver.get_offchain_document(
                self.orgJsonUri,
                dummy_hash
            )

            self.assertEqual(doc, "<dummy>")
            g.assert_called_once_with(self.orgJsonUri)

    def test_get_offchain_document_no_http(self):
        """
        Test to retrieve a document
        """
        with self.assertRaises(DidResolverException) as ctx:

            DidResolver.get_offchain_document(
                'dummy://wrong/protocol',
                b'\x00\x00'
            )

        self.assertEqual(ctx.exception.code, 500)
        self.assertEqual(
            ctx.exception.description,
            'Document URL not supported'
        )

    def test_get_offchain_document_invalid_hash(self):
        """
        Test to retrieve a document with invalid hash
        """
        # Simulate the HTTP answer
        with mock.patch('requests.get') as g:
            g.return_value.text = '<dummy>'
            wrong_hash = bytes(w3.sha3('<dummy2>'))

            with self.assertRaises(DidResolverException) as ctx:
                DidResolver.get_offchain_document(
                    self.orgJsonUri,
                    wrong_hash
                )

            self.assertEqual(ctx.exception.code, 403)
            self.assertEqual(
                ctx.exception.description,
                'Organization hash does not match'
            )

    def test_validate_offline_document(self):
        with open('./test/simard.json', 'r', encoding="utf-8") as fs:
            doc = fs.read()

        d = DidResolver.validate_offchain_document(doc)
        self.assertEqual(json.loads(doc), d)

    @mock.patch('requests.get')
    @mock.patch('web3.contract.ContractCaller')
    def test_full_resolve(self, mock_cc, mock_get):
        """
        Test to perform a full resolution
        """
        # Mock the request get
        with open('./test/simard.json', 'r', encoding="utf-8") as fs:
            doc = fs.read()
        mock_get.return_value.text = doc

        mocked_hash = bytes(w3.sha3(doc))

        # Mock the Contract Caller
        mock_cc.return_value.getOrganization.return_value = (
            self.exists,
            binascii.unhexlify(self.orgId),
            mocked_hash,
            self.orgJsonUri,
            '',
            '',
            binascii.unhexlify(self.parentOrgId),
            self.owner,
            self.director,
            self.isActive,
            self.isDirectorshipAccepted
        )

        # Do the full resolution
        res = DidResolver.full_resolve(self.did)

        # Verify the mocks were called
        mock_get.assert_called_once_with(self.orgJsonUri)
        self.assertTrue(mock_cc.called)

        # Validate the results
        self.assertEqual(res['didDocument'], json.loads(doc))
        expected = {
            'orgId': "0x%s" % self.orgId,
            'orgJsonUri': self.orgJsonUri,
            'orgJsonHash': "0x%s" % mocked_hash.hex(),
            'parentOrgId': "0x%s" % self.parentOrgId,
            'owner': self.owner,
            'director': self.director,
            'isActive': self.isActive,
            'isDirectorshipAccepted': self.isDirectorshipAccepted
        }
        self.assertEqual(res['organization'], expected)

    @mock.patch('redis.Redis.set')
    @mock.patch('redis.Redis.get')
    def test_resolve_cache_hit(self, mock_get, mock_set):
        # Define the mock calls
        doc = {'dummy': 0}
        mock_get.return_value = json.dumps(doc)

        # Check the values
        result = DidResolver.resolve(self.did)
        self.assertEqual(result, doc)

        # Check the mocks
        mock_get.assert_called_once_with("didResultSimard_%s" % self.did)
        self.assertFalse(mock_set.called)

    @mock.patch('simard.did_resolver.DidResolver.full_resolve')
    @mock.patch('redis.Redis.set')
    @mock.patch('redis.Redis.get')
    def test_resolve_cache_miss(self, mock_get, mock_set, mock_rslv):
        # Define the mock calls
        doc = {'dummy': 0}
        mock_get.return_value = None
        mock_set.return_value = True
        mock_rslv.return_value = doc

        # Check the values
        result = DidResolver.resolve(self.did)
        self.assertEqual(result, doc)

        # Check the mocks
        mock_get.assert_called_once_with("didResultSimard_%s" % self.did)
        mock_set.assert_called_once_with("didResultSimard_%s" % self.did, json.dumps(doc), ex=60)
        mock_rslv.assert_called_once_with(self.did)
