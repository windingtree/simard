""""
Define a class to manage the Settlement object
"""
import uuid
from bson.decimal128 import Decimal128
from decimal import Decimal
from model.exception import SimardException
from simard.db import db
from simard.guarantee import Guarantee
from simard.w3 import w3, DISCARD, TransactionNotFound
from schemas import abi
from simard.settings import PAYMENT_MANAGER_CONTRACT, SIMARD_ORGID, GLIDER_OTA_ORGID, USDC_CONTRACT, USDC_DECIMALS


class SettlementException(SimardException):
    pass


class Settlement(object):
    """
    Define a settlement action
    """
    def __init__(
        self,
        initiator,
        beneficiary,
        amount,
        currency,
        agent,
        source=None,
    ):
        """
        Constructor for a new settlement
        """
        # Initialize from parameters
        self.initiator = initiator
        self.beneficiary = beneficiary
        self.amount = Decimal(amount)
        self.currency = currency
        self.agent = agent
        self.source = source

        # Create default values
        self.uuid = str(uuid.uuid4())
        self.guarantee_uuid = None
        self.transaction_hash = None
        self.quote_uuid = None
        self._id = None

    def store(self):
        """
        Store a settlement
        """
        # Prepare the document to store
        document = {
            'uuid': self.uuid,
            'initiator': self.initiator,
            'beneficiary': self.beneficiary,
            'amount': Decimal128(self.amount),
            'currency': self.currency,
            'agent': self.agent,
        }
        if self.guarantee_uuid:
            document['guarantee'] = self.guarantee_uuid

        if self.source:
            document['source'] = self.source

        if self.transaction_hash:
            document['transactionHash'] = self.transaction_hash

        if self.quote_uuid:
            document['quoteId'] = self.quote_uuid

        # For a new insertion, update the internal DB identifier
        if(self._id is None):
            result = db.settlements.insert_one(document)
            self._id = result.inserted_id

        # For an update, update the values
        else:
            db.settlements.update_one(
                {'uuid': self.uuid},
                {'$set': document}
            )

        # Return self for chaining
        return self

    @classmethod
    def from_database_result(cls, result):
        """
        Create the object from a database result
        """
        # Create the object
        settlement = cls(
            initiator=result["initiator"],
            beneficiary=result["beneficiary"],
            amount=result["amount"].to_decimal(),
            currency=result["currency"],
            agent=result["agent"]
        )

        # Add optional guarantee
        if 'guarantee' in result:
            settlement.guarantee_uuid = result['guarantee']

        # Add source
        if 'source' in result:
            settlement.source = result['source']

        # Add transactionHash
        if 'transactionHash' in result:
            settlement.transaction_hash = result['transactionHash']

        # Add quoteId
        if 'quoteId' in result:
            settlement.quote_uuid = result['quoteId']

        # Update reference values
        settlement.uuid = result['uuid']
        settlement._id = result["_id"]

        return settlement

    @classmethod
    def from_storage(cls, settlement_uuid):
        """
        Create the object from storage
        """
        # Get the settlement from DB
        result = db.settlements.find_one({'uuid': settlement_uuid})

        # Check if we have a value
        if result is None:
            return None

        return Settlement.from_database_result(result)

    @classmethod
    def from_guarantee(cls, guarantee: Guarantee, agent, amount=None):
        """
        Create a settlement from a guarantee
        """
        # The amount is defaulted to the guarantee total
        if amount is None:
            amount = guarantee.amount

        else:
            # Check the amount provided is nothigher than guaranteed
            if(amount > guarantee.amount):
                m = "Can not settle an amount higher than guaranteed"
                raise SettlementException(m, 500)

        # Create the settlement object
        settlement = cls(
            initiator=guarantee.initiator,
            beneficiary=guarantee.beneficiary,
            amount=amount,
            currency=guarantee.currency,
            agent=agent,
            source='guarantee',
        )

        # Set the guarantee reference to link it back
        settlement.guarantee_uuid = guarantee.uuid
        return settlement

    @classmethod
    def from_blockchain_deposit(cls, orgid, agent, transaction_hash, quote=None):
        """
        Create a settlement from a Blockchain deposit
        """
        # Check if already settled
        result = db.settlements.find_one({'source': 'ethereum', 'transactionHash': transaction_hash})
        if result is not None:
            return Settlement.from_database_result(result)

        # Get the Payment Manager contract
        payment_manager_contract = w3.eth.contract(
            address=PAYMENT_MANAGER_CONTRACT,
            abi=abi.payment_manager
        )

        # Get the receipt from the transaction hash
        try:
            receipt = w3.eth.getTransactionReceipt(transaction_hash)
        except TransactionNotFound as e:
            raise SettlementException('Transaction Hash: Not found', 400) from e

        # Get the logs from the receipt
        rich_logs = payment_manager_contract.events.Paid().processReceipt(receipt, errors=DISCARD)
        if (rich_logs is None) or (len(rich_logs) != 1):
            raise SettlementException('Transaction Hash: No payment logs found', 400)

        # Get the details of the payment
        index = rich_logs[0]['args']['index']
        payment = payment_manager_contract.functions.payments(index).call()

        # Check if it is a Payment
        if(payment[0] != 0):
            raise SettlementException('Transaction Hash: Not a Payment transaction', 400)
        if(payment[3] != USDC_CONTRACT):
            raise SettlementException('Transaction Hash: Received currency is not USDC', 400)

        # Get the values
        beneficiary_orgid = '0x%s' % payment[6].hex()
        amount = Decimal(payment[4]) / (10**int(USDC_DECIMALS))
        currency = 'USD'

        # Check with the quote values
        if quote is not None:
            # Check the ownership of the quote
            if quote.orgid != orgid:
                raise SettlementException('Quote owned by a different ORGiD', 403)

            # Check the target currency and amount
            if quote.source_currency != currency:
                raise SettlementException('Quote source currency must be USD for USDC blockchain deposit', 400)
            if quote.source_amount.compare(amount) != Decimal('0'):
                raise SettlementException('Blockchain deposit amount does not match quote source amount (%s|%s)' % (amount, quote.source_amount), 400)

            # Replace deposit values with quoted values
            amount = quote.target_amount
            currency = quote.target_currency

        # Create the settlement
        settlement = cls(
            initiator=orgid,
            beneficiary=beneficiary_orgid,
            amount=amount,
            currency=currency,
            agent=agent,
            source='ethereum',
        )

        settlement.transaction_hash = transaction_hash
        if quote is not None:
            settlement.quote_uuid = quote.uuid

        return settlement
