"""
Class to perform DID validation
"""
import requests
from urllib.parse import urlparse
import json
from jsonschema import validate, ValidationError
from collections import namedtuple
from simard.w3 import w3
from model.exception import SimardException
from simard.parser import Parser
from schemas import abi, yaml
from datetime import datetime, timezone, timedelta
from simard.cache import cache
from flask import has_request_context, g
import logging
from simard.settings import ORGID_CONTRACT


# Class to parse the smartcontract answer
Organization = namedtuple('Organization', (
    'exists',
    'orgId',
    'orgJsonHash',
    'orgJsonUri',
    'orgJsonUriBackup1',
    'orgJsonUriBackup2',
    'parentOrgId',
    'owner',
    'director',
    'isActive',
    'isDirectorshipAccepted'
))


class DidResolverException(SimardException):
    pass


class DidResolver(object):
    """
    Wrapper for DID resolving operations
    """
    @staticmethod
    def get_orgid_contract():
        orgid_contract = w3.eth.contract(
            address=ORGID_CONTRACT,
            abi=abi.orgid
        )
        return orgid_contract

    @staticmethod
    def get_onchain_organization(did):
        # Get the ORG.ID and contract
        orgid = Parser.parse_orgid(did)
        contract = DidResolver.get_orgid_contract()

        try:
            # Parse the tuple from the caller into an Organization object
            org_array = contract.caller.getOrganization(orgid)
            o = Organization._make(org_array)

        except Exception as e:
            logging.error(str(e))
            raise DidResolverException(
                'Error Resolving Onchain Organization',
                500) from e

        # Check if the organization exists
        if o.exists:
            return o
        else:
            raise DidResolverException('Organization does not exist', 404)

    @staticmethod
    def get_offchain_document(doc_url: str, doc_hash: bytes):
        """
        Resolve a document
        """
        # Check that the scheme is supported
        scheme = urlparse(doc_url).scheme

        # Get the document
        if scheme in ['http', 'https']:
            doc = requests.get(doc_url).text
        else:
            raise DidResolverException('Document URL not supported', 500)

        # Verify the hash
        if(doc_hash != bytes(w3.sha3(doc))):
            raise DidResolverException('Organization hash does not match', 403)

        return doc

    @staticmethod
    def validate_offchain_document(doc):
        try:
            # Load as JSON and load the schema
            instance = json.loads(doc)

            # Perform the validation
            validate(instance, yaml.orgid)

        except ValidationError as e:
            raise DidResolverException(
                'Organization schema not valid',
                500) from e

        return instance

    @staticmethod
    def full_resolve(did: str):
        """
        Resolve a document
        """
        # Get the current time tco compute the elapsed time
        start = datetime.now(tz=timezone.utc)

        # Get the details of the organization from the smart contract
        organization = DidResolver.get_onchain_organization(did)

        # Resolve the offchain document
        document = DidResolver.get_offchain_document(
            organization.orgJsonUri,
            organization.orgJsonHash
        )
        orgid = "0x%s" % organization.orgId.hex()

        # Perform validation on the document retrieved
        did_document = DidResolver.validate_offchain_document(document)

        # Stop the timer and compute the elapsed
        stop = datetime.now(tz=timezone.utc)
        elapsed = round((stop - start) / timedelta(microseconds=1000))

        # Build the resulting dict
        result = {
            'id': orgid,
            'didDocument': did_document,
            'resolverMetadata': {
                'retrieved': stop.isoformat()[:-9] + 'Z',
                'duration': elapsed,
                'version': "1.1.0-simard",
                'orgIdAddress': orgid
            },
            "errors": [],
            "organization": {
                "orgId": orgid,
                "orgJsonUri": organization.orgJsonUri,
                "orgJsonHash": "0x%s" % organization.orgJsonHash.hex(),
                "parentOrgId": "0x%s" % organization.parentOrgId.hex(),
                "owner": organization.owner,
                "director": organization.director,
                "isActive": organization.isActive,
                "isDirectorshipAccepted": organization.isDirectorshipAccepted
            },
        }

        return result

    @staticmethod
    def resolve(did: str):
        """
        Resolve a DID, using cache if possible
        :param did The DID to resolve
        """
        # Try to get the DID from Flask request context
        if has_request_context() and hasattr(g, 'did_results') and did in g.did_results:
            return g.did_results[did]

        # Try to get the DID from Cache
        did_cache_key = "didResultSimard_%s" % did
        cached_result = cache.retrieve(did_cache_key)

        if cached_result:
            # Update the request context
            if has_request_context():
                g.did_result = cached_result

            # return the cached value
            return cached_result

        # Otherwise perform a full resolution
        result = DidResolver.full_resolve(did)

        # Update FLask request context
        if has_request_context():
            if not hasattr(g, 'did_results'):
                g.did_results = {}
            g.did_results[did] = result

        # Store in Cache
        cache.store(did_cache_key, result)

        # Return the retrieved result
        return result
