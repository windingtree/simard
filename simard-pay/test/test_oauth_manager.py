import unittest
from simard.oauth_manager import OAuthManager, OAuthManagerInvalidToken
from unittest import mock
import json
from simard.settings import ORGIDVALIDATOR_URL, ORGIDVALIDATOR_V2_URL


class TestOauthManagerECDSA(unittest.TestCase):
    def setUp(self):
        # Test value can be checked with https://jwt.io/#debugger-io
        # (except signature)
        self.signatory = "0x0000000000000000000000000000000000099339"
        self.orgid = "0x0000000000000000000000000000000000000000000000000000000000001121"

        self.header_string = "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ"
        self.header_object = {
            "alg": "ES256K",
            "typ": "JWT"
        }
        self.claims_string = "eyJpc3MiOiJkaWQ6b3JnaWQ6MHg1ZTY5OTRmNzY3NjRjZWI0MmM0NzZhMjUwNTA2"
        self.claims_string += "NWE2MTcwMTc4YTI0YzAzZDgxYzlmMzcyNTYzODMwMDAxMTcxI3NlY29uZGtleSIs"
        self.claims_string += "ImF1ZCI6ImRpZDpvcmdpZDoweDVlNjk5NGY3Njc2NGNlYjQyYzQ3NmEyNTA1MDY1"
        self.claims_string += "YTYxNzAxNzhhMjRjMDNkODFjOWYzNzI1NjM4MzAwMDExNzEiLCJleHAiOjI1ODM0"
        self.claims_string += "NDkwMzksInNjb3BlIjoiIn0"

        self.claims_object = {
            "iss": "did:orgid:%s#secondkey" % self.orgid,
            "aud": "did:orgid:%s" % self.orgid,
            "exp": 2583449039,
            "scope": ""
        }
        self.signature_string = "LyL-LjLthNuRXhRqyaeo67O6WO1pK2u72Z8E_TbM48H"
        self.signature_string += "LKmzYOfO3DY-XOc7PdN-0UVdN_RJOYITX1JsjM3OCXA"
        self.signature_hex = "2f22fe2e32ed84db915e146ac9a7a8ebb3ba58ed692b6bbbd99f04fd36cce3c1c"
        self.signature_hex += "b2a6cd839f3b70d8f9739cecf74dfb451574dfd124e6084d7d49b233373825c"

        self.jwt_string = '%s.%s.%s' % (
            self.header_string,
            self.claims_string,
            self.signature_string
        )

    def test_field_to_object_header(self):
        self.assertEqual(
            self.header_object,
            OAuthManager.field_to_object(self.header_string))

    def test_field_to_object_payload(self):
        self.assertEqual(
            self.claims_object,
            OAuthManager.field_to_object(self.claims_string))

    def test_parse_signature_data(self):
        signature = OAuthManager.parse_signature(self.signature_string)
        self.assertEqual(signature, bytes.fromhex(self.signature_hex))

    def test_validate_token_invalid_type(self):
        with self.assertRaises(OAuthManagerInvalidToken):
            OAuthManager.validate_token(15)

    def test_validate_token_invalid_format(self):
        with self.assertRaises(OAuthManagerInvalidToken):
            OAuthManager.validate_token(self.header_string)
        with self.assertRaises(OAuthManagerInvalidToken):
            OAuthManager.validate_token("%s.%s" % (
                self.header_string,
                self.claims_string))

    def test_validate_token(self):
        orgid_v1_req_resp = {
            "jwt": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJhdWQiOiJkaWQ6b3JnaWQ6MHg5NGJmNWE1N2I4NTBhMzViNGQxZDdiNTlmNjYzY2UzYThhNzZmZDk5MjhlZjIwNjdjYzc3MmZjOTdmYjBhZDc1IiwiaXNzIjoiZGlkOm9yZ2lkOjB4MTZiZWM3N2UxODkwYzljNzkwYjJlMWMzMzlhNzhhZDU2MTE0OGUwY2FlN2RhOWNiNTBjNGMxY2Q2NGQ3N2ZlNiNUZXN0TGVpc3VyZUtleUlEMTIzIiwiaWF0IjoxNjY1MTI2ODk0LCJleHAiOjE2NjUyMTMyOTR9.jHjJsext3PdePyOq6id49HD_r27rlH4aow_10dCi2GwS1ZDYPIN4frByIrFqIqjPI9GGAYN2MmHABJwu_63FFg",
            "response": {
                "audience": "did:orgid:0x0000000000000000000000000000000000000000000000000000000000009121",
                "issuer": "did:orgid:0x33300000000000000000000000000000000000000000000000000000000AB121#TestLeisureKeyID123",
                "issuerKeyId": "TestLeisureKeyID123",
                "issuerDID": "0x33300000000000000000000000000000000000000000000000000000000AB121",
            }
        }
        orgid_v2_req_resp = {
            "jwt": "eyJhbGciOiJFUzI1NiIsImtpZCI6IkVjZHNhU2VjcDI1NmsxUmVjb3ZlcnlNZXRob2QyMDIwIiwidHlwIjoiSldUIn0.eyJpc3MiOiJkaWQ6b3JnaWQ6NToweGNiOGM0NDBhNWY2ZTBmMTkxN2JjYWZlNDQ0OWExYmYyNWY3NTFkYjQxZDEwY2Y4YWYyNTkyYWZiMTJjNDQ1ZTkjU2ltYXJkS01TTXVsdGlzaWciLCJhdWQiOiJkaWQ6b3JnaWQ6NToweDgyOTVmNzRlZDU0ZGZhODIyYTEyMTg4OGFlYTExMWI1ZGQ2MDI5ZjNhOWZjZTI4NmZlMzIxMTFlMmEyMjEzZmEifQ.MHg5MTNhN2EwNWQxNDk2ZWFjOTU2ZmY2ZmZkYjUyOGUzOWRjYjM1MDY4YmRmZDc3YmM3M2FmZmMyMGQ4YjVmYzYwMzJiYWI4YmVmM2U1ZGM5ZjExMTkwM2E3YTM2MGNiZGY5NDdiOGYwNWE5NjNmMTM2MmJjMjdkZWQ2NGIyMzQwMjFj",
            "response": {
                "iss": "did:orgid:5:0x3330000000000000000000000000000000000000000000000000000000ABC121#SimardKMSMultisig",
                "aud": "did:orgid:5:0x333000000000000000000000000000000000000000000000000000000ABCD121"
            }}
        def mocked_requests_get(*args, **kwargs):
            class Response:
                def __init__(self, json_data, status_code):
                    self.json_data = json_data
                    self.status_code = status_code
                    self.ok = status_code == 200
                    self.text=""

                def json(self):
                    return self.json_data

            if args[0].find(ORGIDVALIDATOR_URL) > -1:
                return Response({"status": "OK", "payload": orgid_v1_req_resp["response"]}, 200)
            elif args[0].find(ORGIDVALIDATOR_V2_URL) > -1:
                return Response({"status": "OK", "payload": orgid_v2_req_resp["response"]}, 200)
            print(f"Got request to URL:{args[0]}")
            return Response(None, 404)

        patch=mock.patch('simard.oauth_manager.requests.get', side_effect=mocked_requests_get)
        patch.start()
        #validate JWT without chain code - mock response as ORGiD Validator V1
        self.assertEqual(("0x33300000000000000000000000000000000000000000000000000000000AB121",
                          "did:orgid:0x33300000000000000000000000000000000000000000000000000000000AB121"),
                         OAuthManager.validate_token(orgid_v1_req_resp['jwt']))

        # validate JWT without chain code - mock response as ORGiD Validator V2
        self.assertEqual(("0x3330000000000000000000000000000000000000000000000000000000ABC121",
                          "did:orgid:5:0x3330000000000000000000000000000000000000000000000000000000ABC121#SimardKMSMultisig"),
                         OAuthManager.validate_token(orgid_v2_req_resp['jwt']))
        self.addCleanup(patch.stop)

    def test_get_signatory_address(self):
        # FIXME: Need a valid example with an ETH signature
        pass

    def test_validate_authorization_as_owner(self):
        # FIXME: Need a valid example with an ETH signature
        pass

    def test_validate_authorization_rejected_not_owner(self):
        # FIXME: Need a valid example with an ETH signature
        pass

    def test_validate_ecdsa_key_authorization(self):
        with mock.patch('simard.did_resolver.DidResolver.resolve') as r:
            # We partially mock the DID Resolver
            # Only the values being used for authentication
            with open('./test/simard.json', 'r', encoding="utf-8") as fs:
                json_doc = json.load(fs)

            did_document = json_doc
            r.return_value = {
                'id': self.orgid,
                'didDocument': did_document,
            }

            # Validate the key authorization
            validated, orgid = OAuthManager.validate_key_authorization(
                self.claims_object['iss'],
                self.jwt_string
            )

            # Verify the mock calling values
            r.assert_called_once_with(self.orgid)

        # Verify the return values
        self.assertEqual(
            (validated, orgid),
            (True, self.orgid)
        )
