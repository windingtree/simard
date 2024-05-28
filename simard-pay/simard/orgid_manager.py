import requests
import json
from simard.w3 import w3
from model.exception import SimardException


class OrgIdManagerException(SimardException):
    pass


class OrgIdManager(object):
    """
    A class to interact with an ORG.ID
    """
    def __init__(self):
        """
        Initialize the manager with an already initialized Web3 object
        """
        pass

    def get_contract(self, orgid_address):
        """
        Get the smartcontract associated with an ORG.ID
        """
        abi = json.load(open('./api/abi/Organization.json', 'r'))
        orgid_contract = w3.eth.contract(address=orgid_address, abi=abi)
        return orgid_contract

    def get_offchain_data(self, orgid_address):
        """
        Get the offchain JSON data
        """
        # Get the on-chain pointers
        contract = self.get_contract(orgid_address)
        uri = contract.caller.getOrgJsonUri()

        # Get the JSON object
        if(uri[:4] == 'http'):
            orgid_object = requests.get(uri).json()
        else:
            # TODO: Support more schemes, at least swarm
            raise OrgIdManagerException('URI scheme not supported', 500)

        # TODO: Check the hash value
        # json_hash = contract.caller.getOrgJsonHash()

        return orgid_object
