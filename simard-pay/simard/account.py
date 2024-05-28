""""
Define a class to manage the account object
"""
import requests
from .settings import TRANSFERWISE_API_ENDPOINT
from .settings import TRANSFERWISE_API_TOKEN
from .settings import TRANSFERWISE_PROFILE_ID
from model.exception import SimardException
from .db import db
from .did_resolver import DidResolver
import uuid


class AccountException(SimardException):
    pass


class Account(object):

    def __init__(
        self,
        orgid,
        agent,
        currency,
        iban=None,    # ISO 13616:2007
        bic=None,     # https://en.m.wikipedia.org/wiki/ISO_9362
        abartn=None,  # ABA routing transit number (ABA RTN)
        account_number=None,
        account_type=None
    ):
        # Update values from constructor
        self.orgid = orgid
        self.agent = agent
        self.currency = currency
        self.iban = iban
        self.bic = bic
        self.abartn = abartn
        self.account_number = account_number
        self.account_type = account_type

        # Default values
        self.uuid = None
        self.transferwise_id = None
        self.uuid = str(uuid.uuid4())
        self._id = None

    def store(self):
        """
        Store the account in Database
        """
        # Prepare the document to store
        document = {
            'uuid': self.uuid,
            'orgid': self.orgid,
            'agent': self.agent,
            'currency': self.currency,
        }
        if self.iban:
            document['iban'] = self.iban
        if self.bic:
            document['bic'] = self.bic
        if self.transferwise_id:
            document['transferwise_id'] = self.transferwise_id

        # For a new insertion, update the internal DB identifier
        if(self._id is None):
            result = db.accounts.insert_one(document)
            self._id = result.inserted_id

        # For an update, update the values
        else:
            db.accounts.update_one(
                {'uuid': self.uuid},
                {'$set': document}
            )

        return self

    @classmethod
    def from_storage(cls, account_uuid):
        """
        Create the object from storage
        """
        # Get the Account from DB
        result = db.accounts.find_one({'uuid': account_uuid})

        # Check if we have a value
        if result is None:
            return None

        # Create the object
        account = cls(
            orgid=result['orgid'],
            agent=result['agent'],
            currency=result['currency'],
        )

        # Add optional fields
        if 'iban' in result:
            account.iban = result['iban']
        if 'bic' in result:
            account.bic = result['bic']
        if 'transferwise_id' in result:
            account.transferwise_id = result['transferwise_id']

        # Update reference values
        account.uuid = account_uuid
        account._id = result["_id"]

        return account

    @classmethod
    def retrieve_all_accounts(cls, orgid):
        # Check if the database is initialized
        if not db.is_collection_created('accounts'):
            return []

        # Get the Accounts from DB
        result = db.accounts.find({"orgid": orgid})
        if result is None:
            return []

        accounts = []
        for doc in result:
            account = cls(
                orgid=doc['orgid'],
                agent=doc['agent'],
                currency=doc['currency']
            )

            # Add optional fields
            if 'iban' in doc:
                account.iban = doc['iban']
            if 'bic' in doc:
                account.bic = doc['bic']
            if 'transferwise_id' in doc:
                account.transferwise_id = doc['transferwise_id']

            # Update reference values
            account.uuid = doc['uuid']
            account._id = doc["_id"]

            # Add to the array
            accounts.append(account)

        return accounts

    def transferwise_info(self):
        """
        Get the transferwise type and details
        """
        # Currencies where type iban is supported with only IBAN
        if(self.currency in [
            'BGN', 'CHF', 'CZK', 'DKK', 'EUR',
            'GBP', 'GEL', 'HRK', 'HUF', 'NOK',
            'PLN', 'RON', 'SEK'
        ]):
            transferwise_type = 'iban'
            transferwise_details = {'IBAN': self.iban}

        # Currencies where IBAN is supported by recipient type differs
        elif(self.currency in ['AED', 'ILS', 'TRY']):
            tw_map = {
                'AED': 'emirates',
                'ILS': 'israeli_local',
                'TRY': 'turkish_earthport'
            }
            transferwise_type = tw_map[self.currency]
            transferwise_details = {'IBAN': self.iban}

        # US Specifics
        elif(self.currency == 'USD'):
            transferwise_type = 'aba'
            transferwise_details = {
                'abartn': self.abartn,
                'accountNumber': self.account_number,
                'accountType': self.account_type,
            }

        else:
            raise AccountException('Currency not supported', 400)

        return transferwise_type, transferwise_details

    def transferwise_account(self):
        """
        Get the transferwise account details
        """
        # Get thet transferwise info
        transferwise_type, transferwise_details = self.transferwise_info()

        # Get the DID document
        resolved = DidResolver.resolve("did:orgid:%s" % self.orgid)
        if not resolved or 'didDocument' not in resolved:
            raise AccountException('Unable to resolve organization: %s' % self.orgid, 400)
        did_document = resolved['didDocument']

        # Determine the entity type
        is_legal_entity = ('legalEntity' in did_document)
        is_organizational_unit = ('organizationalUnit' in did_document)

        if not is_legal_entity and not is_organizational_unit:
            raise AccountException('Field missing in organization document: legalEntity || organizationalUnit', 400)

        # For Organization Units, get info from parent
        if is_organizational_unit:
            parent_orgid = resolved['organization']['parentOrgId']
            parent = DidResolver.resolve("did:orgid:%s" % parent_orgid)
            if not parent or 'didDocument' not in parent:
                raise AccountException('Unable to resolve parent organization: %s' % parent_orgid, 400)
            did_document = parent['didDocument']

            if 'legalEntity' not in did_document:
                raise AccountException('Field missing in parent organization %s: legalEntity' % parent_orgid, 400)

        # Create the basic account skeleton
        transferwise_account = {
            "currency": self.currency,
            "ownedByCustomer": False,
            "profile": TRANSFERWISE_PROFILE_ID,
            "details": transferwise_details,
            "type": transferwise_type
        }

        # Recipient Legal Name
        transferwise_account['accountHolderName'] = \
            did_document['legalEntity']['legalName']

        # Recipient Legal Type
        if did_document['legalEntity']['legalType'].lower() in [
            "private entrepreneur",
        ]:
            transferwise_account['details']["legalType"] = "PRIVATE"
        else:
            transferwise_account['details']["legalType"] = "BUSINESS"

        # Add address fields
        registered_address = did_document['legalEntity']['registeredAddress']
        tw_address = {}
        tw_address['country'] = registered_address['country']
        tw_address['city'] = registered_address['locality']
        tw_address['postCode'] = registered_address['postalCode']
        tw_address['firstLine'] = "%s, %s" % (
            registered_address['premise'],
            registered_address['streetAddress']
        )

        transferwise_account['details']['address'] = tw_address

        return transferwise_account

    def create_transferwise_recipient(self):
        """
        https://api-docs.transferwise.com/#recipient-accounts-create
        """
        # Fire the request to Transferwise
        r = requests.post(
            TRANSFERWISE_API_ENDPOINT + '/accounts',
            json=self.transferwise_account(),
            headers={
                'Authorization': ("Bearer %s" % TRANSFERWISE_API_TOKEN)
            }
        )

        # Save the created ID
        if(r.status_code != 200):
            reply = r.json()
            if('errors' in reply) and (len(reply['errors']) > 0) and (reply['errors'][0]['code'] == 'NOT_VALID'):
                msg = reply['errors'][0]['message']
                raise AccountException(
                    'Error when creating account [%s]' % msg,
                    400
                )

            raise AccountException(
                'Error when creating account [%s]' % r.text,
                500
            )

        # Save the created ID
        self.transferwise_id = r.json()['id']
        return True

    def delete_transferwise_recipient(self):
        """
        Delete an acount from Tranferwise
        Marking it as inactive
        """
        r = requests.delete(
            "%s%s/%s" % (
                TRANSFERWISE_API_ENDPOINT,
                '/accounts',
                self.transferwise_id
            ),
            headers={
                'Authorization': ("Bearer %s" % TRANSFERWISE_API_TOKEN)
            }
        )
        if(r.status_code != 200):
            print("TRANSFERWISE %i: %s" % (r.status_code, r.text))
            raise AccountException('Error when deactivating account', 500)

        # Clean the variable
        self.transferwise_id = None
        return True

    def delete(self):
        """
        Delete the current account
        """
        # Delete from transferwise
        if(self.transferwise_id):
            try:
                self.delete_transferwise_recipient()
            except Exception:
                pass
            self.transferwise_id = None

        # Delete from DB
        db.accounts.delete_one({"uuid": self.uuid})
        self._id = None
