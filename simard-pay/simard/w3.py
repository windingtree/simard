"""
Simple wrapper around web3 for the proejct needs
"""
from web3 import Web3
from simard.settings import INFURA_WSS_ENDPOINT, INFURA_PROJECT_ID
from web3.logs import STRICT, IGNORE, DISCARD, WARN
from web3.exceptions import TransactionNotFound

class W3(object):
    def __init__(self):
        """
        Initialize using the Infura credentials
        """
        web3_wss = "%s/%s" % (INFURA_WSS_ENDPOINT, INFURA_PROJECT_ID)
        self._w3 = Web3(Web3.WebsocketProvider(web3_wss))

    @property
    def eth(self):
        return self._w3.eth

    def sha3(self, text):
        return self._w3.keccak(text=text)


w3 = W3()
