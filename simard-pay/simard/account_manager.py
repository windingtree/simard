"""
Define a manager class to manage account objects
"""
from .account import Account
from model.exception import SimardException
from .parser import Parser


class AccountManagerException(SimardException):
    pass

ACCOUNT_MANAGER_EXCEPTION_CURRENCY_DUPLICATE = "An account already exists with the same currency"
ACCOUNT_MANAGER_EXCEPTION_NOT_FOUND = "Account reference not found for the organization"

class AccountManager(object):

    @staticmethod
    def get_accounts(orgid):
        """
        Get all accounts for an ORG.ID
        """
        orgid = Parser.parse_orgid(orgid)
        return Account.retrieve_all_accounts(orgid)

    @staticmethod
    def create_account(orgid, agent, iban, currency):
        """
        Create account
        """
        # Parse unsafe fields
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        iban = Parser.parse_iban(iban)
        currency = Parser.parse_currency(currency)

        # Avoid duplicates
        for a in Account.retrieve_all_accounts(orgid):
            if(a.currency == currency):
                raise AccountManagerException(
                    ACCOUNT_MANAGER_EXCEPTION_CURRENCY_DUPLICATE,
                    400
                )

        # Add the account
        account = Account(
            orgid=orgid,
            agent=agent,
            currency=currency,
            iban=iban
        )

        # Store the account
        try:
            account.create_transferwise_recipient()
        except Exception:
            pass
        account.store()

        return account.uuid

    @staticmethod
    def get_account(orgid, account_uuid):
        """
        Retrieve the account from DB
        """
        # Parse unsafe fields
        account_uuid = Parser.parse_uuid(account_uuid)
        orgid = Parser.parse_orgid(orgid)

        # Get the account from storage
        account = Account.from_storage(account_uuid)
        if(account is None) or (account.orgid != orgid):
            raise AccountManagerException(
                ACCOUNT_MANAGER_EXCEPTION_NOT_FOUND,
                404
            )
        return account

    @staticmethod
    def update_account(orgid, agent, account_uuid, currency, iban):
        """
        Update an account
        """
        # Parse unsafe fields
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        account_uuid = Parser.parse_uuid(account_uuid)
        currency = Parser.parse_currency(currency)
        iban = Parser.parse_iban(iban)

        # Get the account
        account = Account.from_storage(account_uuid)
        if(account is None) or (account.orgid != orgid):
            raise AccountManagerException(
                ACCOUNT_MANAGER_EXCEPTION_NOT_FOUND,
                404
            )

        # If currency has changed, check if no other account exist in this currency
        if account.currency != currency:
            for a in Account.retrieve_all_accounts(orgid):
                # Skip current one
                if(a.uuid == account_uuid):
                    continue

                # For different UUID, check the currency is different
                if(a.currency == currency):
                    raise AccountManagerException(
                        ACCOUNT_MANAGER_EXCEPTION_CURRENCY_DUPLICATE,
                        400
                    )

        # Do the update
        account.iban = iban
        account.currency = currency

        try:
            account.create_transferwise_recipient()
        except Exception:
            pass
        account.store()

        return True

    @staticmethod
    def delete_account(orgid, account_uuid):
        """
        Delete an account
        """
        # Parse unsafe fields
        orgid = Parser.parse_orgid(orgid)
        account_uuid = Parser.parse_uuid(account_uuid)

        # Get the account
        account = Account.from_storage(account_uuid)

        # Check if exists
        if(account is None) or (account.orgid != orgid):
            raise AccountManagerException(
                ACCOUNT_MANAGER_EXCEPTION_NOT_FOUND,
                404
            )

        # Delete
        account.delete()
