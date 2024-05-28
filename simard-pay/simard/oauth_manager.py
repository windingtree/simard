import base64
import json

import requests
from eth_account.messages import encode_defunct
from model.exception import SimardException
from simard.settings import SIMARD_ORGID, ORGIDVALIDATOR_URL, SIMARD_ORGID_CHAINID, ORGIDVALIDATOR_V2_URL, \
    ORGID_VALIDATION_DISABLED
from simard.w3 import w3
from simard.parser import Parser
from simard.did_resolver import DidResolver
import re
import ecdsa
import hashlib
import time


class OAuthManagerInvalidToken(SimardException):
    pass


class OAuthManagerWeb3Exception(SimardException):
    pass


class OAuthManager(object):
    """
    A class to handle OAuth with ORG.ID
    """

    @staticmethod
    def field_to_bytes(jwt_field):
        """
        Convert a JWT field into hexa value
        """
        # as per RFC7515 appendix C
        # Replace b64 characters that were exchanged
        field = jwt_field.replace('-', '+').replace('_', '/')

        # Add trailings =
        nb = len(field) % 4
        if(nb == 2):
            field += "=="
        elif(nb == 3):
            field += "="
        elif(nb == 1):
            raise OAuthManagerInvalidToken(
                "Illegal base64url string in JWT Token", 400)

        return base64.b64decode(field)

    @staticmethod
    def field_to_object(jwt_field):
        """
        Convert a JWT JSON field into a python structure
        """
        # Parse the field
        field = OAuthManager.field_to_bytes(jwt_field)

        # Get back the JSON object
        try:
            return json.loads(field)
        except Exception as e:
            raise OAuthManagerInvalidToken(
                "JWT Token field is not Base64 encoded JSON", 400) from e

    @staticmethod
    def parse_header(jwt_header):
        """
        Parse a header as per
        - https://tools.ietf.org/html/rfc7515
        - https://github.com/ethereum/EIPs/issues/1341
        """
        # Unpack the header JSON object
        header = OAuthManager.field_to_object(jwt_header)

        # Check the header - default is JWT
        if 'typ' in header and \
           header['typ'].lower() not in ['jwt', 'application/jwt']:
            raise OAuthManagerInvalidToken(
                "JWT Token header typ invalid", 400)

        # Check the algorithm
        if(header["alg"] not in ["ETH", "ES256K"]):
            raise OAuthManagerInvalidToken(
                "JWT Token algorithm must be ETH or ES256K", 400)

        return header

    @staticmethod
    def parse_claims(jwt_claims):
        """
        Parse the claim to validate the provided information is valid
        """
        # Parse the claims to a python object
        claims = OAuthManager.field_to_object(jwt_claims)

        # Validate that ORG.IDs are there
        if('iss' not in claims):
            raise OAuthManagerInvalidToken(
                "JWT Token is missing issuing ORG.ID", 400)
        if('aud' not in claims):
            raise OAuthManagerInvalidToken(
                "JWT Token is missing audience ORG.IDs", 400)

        # Validate the token was meant for Simard
        if ('did:orgid:%s' % SIMARD_ORGID) not in claims['aud'] and \
           SIMARD_ORGID not in claims['aud'] and \
           '<simard>' not in claims['aud']:

            raise OAuthManagerInvalidToken(
                "JWT Token not meant for Simard", 400)

        # Check if the token is not expired
        if ('exp' in claims) and \
           (time.time() > float(claims['exp'])):
            raise OAuthManagerInvalidToken(
                "JWT Token is expired", 403)

        # Check if the token is not used to soon
        if ('nbf' in claims) and \
           (time.time() < float(claims['nbf'])):
            raise OAuthManagerInvalidToken(
                "JWT Token is not yet valid", 403)

        return claims

    @staticmethod
    def parse_signature(jwt_signature):
        """
        Parse a signature
        """
        # Unpack the signature bytes string
        return OAuthManager.field_to_bytes(jwt_signature)

    @staticmethod
    def get_ethereum_signatory_address(jwt_token):
        """
        Validate a signature and extracts the signatory address
        """
        # Check the web3 instance is present
        if(w3 is None):
            raise OAuthManagerWeb3Exception(
                "Error interacting with Ethereum", 503)

        # Extract the part to build the signed message
        jwt_parts = jwt_token.split('.', 2)
        signed_message = '.'.join(jwt_parts[0:2])
        signature = OAuthManager.field_to_bytes(jwt_parts[2])
        message = encode_defunct(text=signed_message)

        # Recover the address
        address = w3.eth.account.recover_message(
            message,
            signature=signature)

        return address

    @staticmethod
    def validate_eth_authorization(account, orgid):
        """
        Validate that a given account is authorized for an ORG.ID
        """
        # Get the organization
        orgid = Parser.parse_orgid(orgid)
        doc = DidResolver.resolve(orgid)

        # Check if the account is either owner or director
        organization = doc['organization']
        return (account in [organization['owner'], organization['director']])

    @staticmethod
    def validate_key_authorization(keyid, jwt_token):
        # Check format and extract parameters
        m = re.match(
            r'^did:orgid:(?P<orgid>0x[A-Za-z0-9]{64})#(?P<keyid>.+)$',
            keyid
        )
        if not m:
            raise OAuthManagerInvalidToken(
                "JWT Token issuing ORG.ID format is not supported", 400)

        # Get the URI and Hash from the contract
        orgid = m.group('orgid')
        doc = DidResolver.resolve(orgid)

        # Get the list of keys
        if 'publicKey' not in doc['didDocument']:
            raise OAuthManagerInvalidToken(
                "ORG.ID has no public keys", 400)

        for public_key in doc['didDocument']['publicKey']:
            # If the key is found, it is authorized
            if keyid in [public_key['id'], 'did:orgid:' + public_key['id']]:
                # Check if the signature type matches
                if(public_key['type'] != 'secp256k1'):
                    raise OAuthManagerInvalidToken(
                        "JSON public key type does not match", 400)

                # Get the message and signature
                jwt_parts = jwt_token.split('.', 2)
                message = '.'.join(jwt_parts[0:2]).encode()
                signature = OAuthManager.field_to_bytes(jwt_parts[2])

                # Load the key
                try:
                    vk = ecdsa.VerifyingKey.from_pem(
                        public_key['publicKeyPem'],
                        hashfunc=hashlib.sha256
                    )
                except Exception as e:
                    raise OAuthManagerInvalidToken(
                        "Unable to load the Public Key reference indicated by the JWT from the ORG.ID JSON",
                        400
                    ) from e

                # Verify the signature
                # Note that it differs from openssl signature
                # as OpenSSL creates an ASN.1 signature
                try:
                    signature_match = vk.verify(
                        signature,
                        message,
                        hashfunc=hashlib.sha256
                    )
                except ecdsa.keys.BadSignatureError as e:
                    raise OAuthManagerInvalidToken(
                        "Unable to decode the JWT signature",
                        400
                    ) from e

                # If it does not match, raise an error
                if(not(signature_match)):
                    raise OAuthManagerInvalidToken(
                        "JWT signature does not match with referenced key",
                        400
                    )
                return True, orgid

        # If no key is found, it is not authorized
        raise OAuthManagerInvalidToken(
            "JWT key %s is not authorized" % keyid, 400)

    @staticmethod
    def validate_token_old(jwt_token):
        """
        Validate a JWT Token
        """
        validated = False
        orgid = None

        # Check the type is string
        if not isinstance(jwt_token, str):
            raise OAuthManagerInvalidToken(
                "JWT Token is not a string", 400)

        # Split the elements
        elements = str(jwt_token).split('.')
        if(len(elements) != 3):
            raise OAuthManagerInvalidToken(
                "JWT Token format is not valid %d" % len(elements), 400)

        # Get and validate the different elements
        header = OAuthManager.parse_header(elements[0])
        claims = OAuthManager.parse_claims(elements[1])

        # Verify ethereum algorithm type
        if(header['alg'] == 'ETH'):
            # Get the signatory address
            address = OAuthManager.get_ethereum_signatory_address(jwt_token)
            orgid = Parser.parse_orgid(claims['iss'])

            # Verify with the ORG.ID contract that the signatory is allowed
            validated = OAuthManager.validate_eth_authorization(address, orgid)
            key_reference = address

        # Verify ES256K
        elif(header['alg'] == 'ES256K'):
            # Validate that the key is authorized
            key_reference = claims['iss']
            validated, orgid = OAuthManager.validate_key_authorization(
                key_reference, jwt_token)

        else:
            raise OAuthManagerInvalidToken(
                "JWT Signature algorithm not supported", 400)

        if not validated:
            raise OAuthManagerInvalidToken(
                "JWT Token not authorized", 403)

        # Provide the claims
        return orgid, key_reference

    @staticmethod
    def validate_token(jwt_token):
        # extract jwt payload
        elements = str(jwt_token).split('.')
        if (len(elements) != 3):
            raise OAuthManagerInvalidToken(
                "JWT Token format is not valid %d" % len(elements), 400)
        claims = OAuthManager.field_to_object(elements[1])
        if ('iss' not in claims):
            raise OAuthManagerInvalidToken(
                "JWT Token could not be validated - missing issuer field", 403)

        (chain, did, agentkey) = Parser.parse_did_into_elements(claims['iss'])

        # should we skip orgID validation? (only in DEV)?
        if ORGID_VALIDATION_DISABLED:
            return f"did:orgid:{did}",claims['iss']

        if chain is not None:
            return OAuthManager._validate_token_v2(jwt_token)
        return OAuthManager._validate_token_v1(jwt_token)

    @staticmethod
    def _validate_token_v1(jwt_token):
        """Validate token using ORGiD validator V1 (JWT with iss/aud without chainID)"""
        r = requests.get(ORGIDVALIDATOR_URL + '/jwt', {'jwt': jwt_token, 'audience': 'did:orgid:' + SIMARD_ORGID})

        # Validate the API response
        if not r.ok:
            raise OAuthManagerInvalidToken(
                "JWT Token could not be validated [%i: %s]" % (r.status_code, r.text), 502)

        # Check if JWT validation was successful
        validation = r.json()
        if validation["status"] != "OK":
            raise OAuthManagerInvalidToken(
                "JWT Token not authorized: " + r.text, 403)

        # Check if required fields are here
        if ('payload' in validation) and \
            ('issuerKeyId' in validation['payload']) and \
                ('issuer' in validation['payload']):

            return validation['payload']['issuerDID'], validation['payload']['issuer']

    @staticmethod
    def _validate_token_v2(jwt_token):
        """Validate token using ORGiD validator V2 (JWT with iss/aud with chainID, different response than V1)"""
        r = requests.get(ORGIDVALIDATOR_V2_URL + '/jwt', {'jwt': jwt_token, 'audience': f'did:orgid:{SIMARD_ORGID_CHAINID}:{SIMARD_ORGID}'})

        # Validate the API response
        if not r.ok:
            raise OAuthManagerInvalidToken(
                "JWT Token could not be validated [%i: %s]" % (r.status_code, r.text), 502)

        # Check if JWT validation was successful
        validation = r.json()
        if validation["status"] != "OK":
            raise OAuthManagerInvalidToken(
                "JWT Token not authorized: " + r.text, 403)

        if ('payload' not in validation or 'iss' not in validation['payload'] or 'aud' not in validation['payload']):
            raise OAuthManagerInvalidToken(
                "JWT Token could not be validated - missing claims", 403)

        #prev version of ORGiD validator returned issuerDID which was 0x address (no keyID, no DID prefix)
        #new version or ORGiD validator does not have it so we need to ditch keyID and then parse did
        issuerDID = validation['payload']['iss'].split("#")[0]
        return Parser.parse_orgid(issuerDID), validation['payload']['iss']

