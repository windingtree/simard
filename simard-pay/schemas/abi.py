"""
Wrapper object to get the ABIs from memory
"""
from schemas.abi_orgid import abi as orgid_abi
from schemas.abi_payment_manager import abi as payment_manager_abi


class ABI(object):
    def __init__(self):
        self.orgid = orgid_abi
        self.payment_manager = payment_manager_abi
