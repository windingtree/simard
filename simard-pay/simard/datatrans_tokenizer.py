import requests
from base64 import b64encode

from simard.settings import (
    PCIPROXY_API_USERNAME,
    PCIPROXY_API_PASSWORD,
    DATATRANS_TOKENIZE_URL
)

class DataTransTokenizerException(Exception):
    pass

class CardNumberAndCVV(object):
    def __init__(
            self,
            cc,
            cvv
    ):
        self.cc = cc
        self.cvv = cvv

class TokenizedCard(object):
    def __init__(
            self,
            cc_alias,
            cvv_alias,
            masked_number,
            fingerprint
    ):
        self.cc_alias = cc_alias
        self.cvv_alias = cvv_alias
        self.masked_number = masked_number
        self.fingerprint = fingerprint



class DataTransTokenizer(object):

    @staticmethod
    def tokenize_card(data:CardNumberAndCVV) -> TokenizedCard:
        #validate data
        if data is None or not data.cc or not data.cvv:
            raise DataTransTokenizerException('Card number and CVV are required', 502)

        pci_tokenize_data = {
            'requests':[
                {
                    'type':'CARD',
                    'pan':data.cc
                },
                {
                    'type':'CVV',
                    'cvv':data.cvv
                },
            ]
        }
        headers = {
            'Authorization' : f'Basic {b64encode(f"{PCIPROXY_API_USERNAME}:{PCIPROXY_API_PASSWORD}".encode("utf-8")).decode("ascii")}'
        }
        pci_tokenize_res = requests.post(
            url=DATATRANS_TOKENIZE_URL,
            json=pci_tokenize_data,
            headers=headers
        )
        if pci_tokenize_res.status_code != 200:
            raise DataTransTokenizerException(
                f'DataTrans tokenization API returned status code {pci_tokenize_res.status_code}',
                502
            )
        response = pci_tokenize_res.json()
        failed_tokens=int(response["overview"]["failed"])
        if failed_tokens>0:
            raise DataTransTokenizerException(
                'Failed to tokenize card or/and cvv',
                502
            )

        card_alias=response["responses"][0]
        cvv_alias=response["responses"][1]
        return TokenizedCard(cc_alias=card_alias['alias'], cvv_alias=cvv_alias['alias'], masked_number=card_alias['maskedCC'], fingerprint=card_alias['fingerprint'])
