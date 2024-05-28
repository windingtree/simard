""""
Define a class to manage the Guarantee object
"""
import uuid
from bson.decimal128 import Decimal128
from decimal import Decimal
from model.exception import SimardException
from simard.db import db
import dateutil.parser
from datetime import datetime


class GuaranteeException(SimardException):
    pass


class Guarantee(object):
    """
    Define a guarantee
    """
    def __init__(
        self,
        initiator,
        beneficiary,
        amount: Decimal,
        currency,
        expiration: datetime,
        agent
    ):
        """
        Constructor for a new guarantee
        """
        # Initialize from parameters
        self.initiator = initiator
        self.beneficiary = beneficiary
        self.amount = Decimal(amount)
        self.currency = currency
        self.expiration = expiration
        self.agent = agent
        self.claimed = False

        # Create default values
        self.uuid = str(uuid.uuid4())
        self._id = None

    def store(self):
        # For a new insertion, update the internal DB identifier
        if(self._id is None):
            result = db.guarantees.insert_one({
                "uuid": self.uuid,
                "initiator": self.initiator,
                "beneficiary": self.beneficiary,
                "amount": Decimal128(self.amount),
                "currency": self.currency,
                "expiration": self.expiration.isoformat(),
                "agent": self.agent,
                "claimed": self.claimed
            })
            self._id = result.inserted_id

        # For an update, update the values
        else:
            db.guarantees.update_one(
                {
                    "uuid": self.uuid
                }, {
                    "$set": {
                        "initiator": self.initiator,
                        "beneficiary": self.beneficiary,
                        "amount": Decimal128(self.amount),
                        "currency": self.currency,
                        "expiration": self.expiration.isoformat(),
                        "agent": self.agent,
                        "claimed": self.claimed
                    }
                },
                upsert=True
            )

        # Return self for chaining
        return self

    def cancel(self):
        """
        Cancel a guarantee
        """
        # TODO: Improve this by not deleting but adding a flag
        db.guarantees.delete_one({"uuid": self.uuid})

    def flag_claimed(self):
        """
        Update the status to claimed
        """
        self.claimed = True
        db.guarantees.update_one(
            {
                "uuid": self.uuid
            }, {
                "$set": {
                    "claimed": True,
                }
            },
            upsert=True
        )

    @classmethod
    def from_storage(cls, guarantee_uuid):
        """
        Create the object from storage
        """
        # Get the guarantee from DB
        result = db.guarantees.find_one({"uuid": guarantee_uuid})

        # Handle the not found error
        if result is None:
            return None

        # Create the guarantee
        guarantee = cls(
            initiator=result["initiator"],
            beneficiary=result["beneficiary"],
            amount=result["amount"].to_decimal(),
            currency=result["currency"],
            expiration=dateutil.parser.isoparse(result["expiration"]),
            agent=result["agent"],
        )

        # Update reference values
        guarantee.uuid = guarantee_uuid
        guarantee._id = result["_id"]
        guarantee.claimed = result["claimed"]

        return guarantee
