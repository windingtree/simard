"""
Define a manager class to manage balance objects
"""
from simard.balance import Balance
from simard.settlement import Settlement
from simard.guarantee import Guarantee
from simard.account_manager import AccountManager, AccountManagerException
from model.exception import SimardException
from simard.settings import VIRTUAL_CARD_ORGID, SIMARD_ORGID
from simard.virtualcard import VirtualCard
from simard.parser import Parser
from decimal import Decimal
from datetime import datetime, timezone
from simard.settings import GLIDER_B2B_ORGID
from simard.quote_manager import QuoteManager
from iso4217 import Currency


class BalanceManagerException(SimardException):
    pass

class BalanceManagerGuaranteeNotFoundException(SimardException):
    pass

class BalanceManager(object):

    @staticmethod
    def format_amount(amount, currency):
        decimal_places = Currency(currency.upper()).exponent
        return round(amount, decimal_places)

    @staticmethod
    def get_balances(orgid):
        # Verify format
        parsed_orgid = Parser.parse_orgid(orgid)

        return Balance.retrieve_all(parsed_orgid)

    @staticmethod
    def get_balance(orgid, currency):
        # Verify format
        parsed_orgid = Parser.parse_orgid(orgid)
        parsed_currency = Parser.parse_currency(currency)

        return Balance(
            orgid=parsed_orgid,
            currency=parsed_currency
        )

    @staticmethod
    def execute_settlement(settlement: Settlement):
        try:
            s = settlement.store()
            return s.uuid
        except Exception as e:
            raise BalanceManagerException('DB Exception [%s]' % str(e), 500) \
                from e

    @staticmethod
    def add_deposit(orgid, agent, currency, amount, source='faucet'):
        # Verify format
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        currency = Parser.parse_currency(currency)
        amount = Parser.parse_amount(amount)

        return Settlement(
            initiator=source,
            beneficiary=orgid,
            amount=amount,
            currency=currency,
            agent=agent
        ).store().uuid

    @staticmethod
    def add_blockchain_deposit(orgid, agent, instrument, chain, transaction_hash, quote_uuid=None):
        # Verify format
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        transaction_hash = Parser.parse_transaction_hash(transaction_hash)

        # Not used for now
        instrument = Parser.parse_instrument(instrument)
        chain = Parser.parse_chain(chain)

        # Get optional quote
        if quote_uuid is not None:

            # Retrieve the quote
            quote_uuid = Parser.parse_uuid(quote_uuid)
            quote = QuoteManager.get_quote(orgid, agent, quote_uuid)

            # Check if the quote is not already used
            if quote.is_used:
                raise BalanceManagerException('Quote has already been used for an exchange', 400)

        else:
            quote = None

        # Create the Settlement
        s = Settlement.from_blockchain_deposit(
            orgid=orgid,
            agent=agent,
            transaction_hash=transaction_hash,
            quote=quote
        )
        s.store()

        # If the settlement was based on a quote, execute it
        if quote is not None:
            quote.execute()
            quote.store()

        return s.uuid

    @staticmethod
    def add_guarantee(
        initiating_orgid,
        initiating_agent,
        receiving_orgid,
        currency,
        amount,
        expiration
    ):
        """
        Adds a guarantee on a balance
        """

        # Verify format
        initiating_orgid = Parser.parse_orgid(initiating_orgid)
        initiating_agent = Parser.parse_agent(initiating_agent)
        receiving_orgid = Parser.parse_orgid(receiving_orgid)
        currency = Parser.parse_currency(currency)
        amount_decimal = Parser.parse_amount(amount)
        expiration_datetime = Parser.parse_expiration(expiration)

        # Verify the two parties are different
        if(initiating_orgid == receiving_orgid):
            raise BalanceManagerException(
                "Can not create a guarantee for the same organization",
                400)

        try:
            # Retrieve the initiating balance
            balance = BalanceManager.get_balance(initiating_orgid, currency)
            if(balance.available < amount_decimal):
                raise BalanceManagerException(
                    "Insufficient balance to create guarantee",
                    400)

            # Make the guarantee
            return Guarantee(
                initiator=initiating_orgid,
                beneficiary=receiving_orgid,
                amount=amount_decimal,
                currency=currency,
                expiration=expiration_datetime,
                agent=initiating_agent
            ).store().uuid

        # Re-throw the exception if it is from Simard
        except SimardException as e:
            raise BalanceManagerException(e.description, e.code) from e

        # Throw a generic exception otherwise
        except Exception as e:
            raise BalanceManagerException('Could not create guarantee [%s|%s|%s]' % (str(e), currency, amount), 500) \
                from e

    @staticmethod
    def get_guarantee(orgid, guarantee_id):
        # Verify format
        orgid = Parser.parse_orgid(orgid)
        guarantee_id = Parser.parse_uuid(guarantee_id)

        # Retrieve the guarantee
        guarantee = Guarantee.from_storage(guarantee_id)

        # Check if it exists
        if guarantee is None:
            raise BalanceManagerGuaranteeNotFoundException(
                "Guarantee not found", 404)

        # Check if the orgid is allowed to retrieve it
        if guarantee.beneficiary != orgid and \
           guarantee.initiator != orgid:

            raise BalanceManagerException(
                "Guarantee can only be retrieved by the parties involved", 403)

        return guarantee

    @staticmethod
    def claim_guarantee(claiming_orgid, claiming_agent, guarantee_id):
        # Parse fields
        claiming_orgid = Parser.parse_orgid(claiming_orgid)
        claiming_agent = Parser.parse_agent(claiming_agent)
        guarantee_id = Parser.parse_uuid(guarantee_id)

        # Retrieve the guarantee
        guarantee = BalanceManager.get_guarantee(claiming_orgid, guarantee_id)

        # Check if the claiming party is the creditor
        if(claiming_orgid != guarantee.beneficiary):
            raise BalanceManagerException(
                "The guarantee can only be claimed by the receiving party",
                403
            )

        # Process the guarantee claim update
        try:

            # Check if it has already been claimed
            if(guarantee.claimed):
                raise BalanceManagerException(
                    "The guarantee has already been claimed",
                    400
                )

            # Process the guarantee update with full amount
            settlement_uuid = Settlement.from_guarantee(
                guarantee=guarantee,
                agent=claiming_agent,
            ).store().uuid

            # Flag the guarantee as claimed
            guarantee.flag_claimed()

            return settlement_uuid

        # Re-throw the exception if it is from Simard
        except SimardException as e:
            raise BalanceManagerException(e.description, e.code) from e

        # Throw a generic exception otherwise
        except Exception as e:
            raise BalanceManagerException('Balance error claiming guarantee [%s]' % str(e), 500) \
                from e

    @staticmethod
    def cancel_guarantee(orgid, guarantee_id):
        # Parse fields
        orgid = Parser.parse_orgid(orgid)
        guarantee_id = Parser.parse_uuid(guarantee_id)

        # Retrieve the guarantee
        guarantee = BalanceManager.get_guarantee(orgid, guarantee_id)

        # Check if the claiming party is the debitor
        if(orgid not in [
            guarantee.beneficiary,
            guarantee.initiator
        ]):
            raise BalanceManagerException(
                "The guarantee can only be canceled by the involved parties",
                403)

        # Check if the guarantee is expired
        if(orgid == guarantee.initiator):
            expiration_dt = guarantee.expiration
            is_expired = expiration_dt > datetime.now(timezone.utc)
            if is_expired:
                raise BalanceManagerException(
                    "Guarantee cannot be canceled before it expires",
                    400)

        # Process the cancelation
        try:
            guarantee.cancel()
            return True

        # Re-throw the exception if it is from Simard
        except SimardException as e:
            raise BalanceManagerException(e.description, e.code) from e

        # Throw a generic exception otherwise
        except Exception as e:
            raise BalanceManagerException('Balance error when canceling guarantee [%s]' % str(e), 500) \
                from e

    @staticmethod
    def withdraw(orgid, agent, currency):
        # Parse fields
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        currency = Parser.parse_currency(currency)

        # Get the balance to verify if available > 0
        orgid_balance = BalanceManager.get_balance(orgid, currency)
        available = Decimal(orgid_balance.available)
        if(available <= Decimal('0.0')):
            raise BalanceManagerException(
                'No available balance to withdraw',
                400)

        # Process the withdrawal
        try:
            # Verify an account exists in the requested currency
            accounts = AccountManager.get_accounts(orgid)
            has_currency = False
            for a in accounts:
                if a.currency == currency:
                    has_currency = True
                    break

            if(not has_currency):
                raise AccountManagerException("No account in required currency", 404)

            # TODO: Implement automatic transfers as well
            return Settlement(
                initiator=orgid,
                beneficiary='Bank Transfer',
                amount=available,
                currency=currency,
                agent=agent
            ).store().uuid

        # Return nicer error if the account is not found
        except AccountManagerException as e:
            if e.code == 404:
                raise BalanceManagerException(
                    'No recipient account configured to withdraw',
                    400) from e
            else:
                raise BalanceManagerException(
                    e.description,
                    e.code) from e

        # Re-throw the exception if it is from Simard
        except SimardException as e:
            raise BalanceManagerException(e.description, e.code) from e

        # Throw a generic exception otherwise
        except Exception as e:
            raise BalanceManagerException('Balance error when withdrawing [%s]' % str(e), 500) \
                from e

    @staticmethod
    def generate_virtual_card(
        orgid,
        agent,
        currency,
        amount,
        expiration
    ):
        """
        Create a single-use virtual card
        """
        # Parse fields
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        currency = Parser.parse_currency(currency)
        amount = Parser.parse_amount(amount)
        expiration_datetime = Parser.parse_expiration(expiration)

        # Check that only GLIDER B2B Can do this for now
        if orgid != GLIDER_B2B_ORGID:
            raise BalanceManagerException('Functionality restricted to [%s], got [%s]' % (GLIDER_B2B_ORGID, orgid), 503)

        # Create the guarantee
        guarantee_id = BalanceManager.add_guarantee(
            initiating_orgid=orgid,
            initiating_agent=agent,
            receiving_orgid=VIRTUAL_CARD_ORGID,
            currency=currency,
            amount=amount,
            expiration=expiration,
        )

        # Generate a card
        virtual_card = None
        try:
            virtual_card = VirtualCard.generate(
                currency=currency,
                amount=amount,
                expiration=expiration_datetime,
                guarantee_id=guarantee_id
            )
            return virtual_card

        # Re-throw the exception if it is from Simard
        except SimardException as e:
            raise BalanceManagerException(e.description, e.code) from e

        # Throw a generic exception otherwise
        except Exception as e:
            raise BalanceManagerException('Balance error when creating virtual card [%s]' % str(e), 500) \
                from e

        finally:
            # Cancel the guarantee if something went wrong
            if virtual_card is None:
                BalanceManager.cancel_guarantee(
                    VIRTUAL_CARD_ORGID,
                    guarantee_id
                )

    @staticmethod
    def cancel_virtual_card(
        orgid,
        agent,
        guarantee_id
    ):
        """
        Cancel a Virtual Card and associated guarantee
        """
        # Parse fields
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        guarantee_id = Parser.parse_uuid(guarantee_id)

        # Retrieve the card guarantee
        try:
            guarantee = BalanceManager.get_guarantee(orgid, guarantee_id)
        except BalanceManagerGuaranteeNotFoundException:
            raise BalanceManagerException(
                "Card not found", 404)
        except BalanceManagerException:
            raise BalanceManagerException(
                "Card can only be canceled by the card creator", 403)

        # Cancel the card
        VirtualCard.cancel(guarantee.uuid)

        # For now only cancel the guarantee blindly
        BalanceManager.cancel_guarantee(
            VIRTUAL_CARD_ORGID,
            guarantee.uuid
        )

        return True

    @staticmethod
    def claim_guarantee_with_card(
        claiming_orgid,
        claiming_agent,
        guarantee_id,
        card_expiration
    ):
        """
        Claim a guarantee and generate a virtual card at the same time
        """

        # Note: Fields are parsed in sub-functions
        # But expiration must be checked before claiming
        Parser.parse_expiration(card_expiration)
        orgid = Parser.parse_orgid(claiming_orgid)

        # Check that only GLIDER B2B Can do this for now
        if orgid != GLIDER_B2B_ORGID:
            raise BalanceManagerException('Functionality restricted, unauthorized ORGiD', 503)

        # Process the claim
        settlement_uuid = BalanceManager.claim_guarantee(
            claiming_orgid=claiming_orgid,
            claiming_agent=claiming_agent,
            guarantee_id=guarantee_id
        )

        # Get the amount and currency
        # TODO: Refactor the code to avoid a second call to DB
        settlement = Settlement.from_storage(settlement_uuid)
        card = BalanceManager.generate_virtual_card(
            orgid=claiming_orgid,
            agent=claiming_agent,
            currency=settlement.currency,
            amount=settlement.amount,
            expiration=card_expiration
        )

        return card, settlement_uuid

    @staticmethod
    def swap(
        orgid,
        agent,
        quotes,
    ):
        """
        Swap balances using previously create quotes
        """
        # Parse fields
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        if not isinstance(quotes, list):
            raise BalanceManagerException('Missing or invalid quotes array', 400)
        if len(quotes) == 0:
            raise BalanceManagerException('No quotes to process', 400)

        # Check all quotes provided
        parsed_quotes = []
        required_balances = {}
        for quote_item in quotes:
            # Retrieve quote
            quote_uuid = Parser.parse_uuid(quote_item)
            quote = QuoteManager.get_quote(orgid=orgid, agent=agent, quote_uuid=quote_uuid)
            parsed_quotes.append(quote)

            # Increase source and target balance
            if quote.source_currency not in required_balances:
                required_balances[quote.source_currency] = 0
            if quote.target_currency not in required_balances:
                required_balances[quote.target_currency] = 0

            required_balances[quote.source_currency] += quote.source_amount
            required_balances[quote.target_currency] -= quote.target_amount

        # Check that balances are sufficient
        for currency in required_balances:
            # Skip negative required balances (received funds)
            if required_balances[currency] < 0:
                continue

            # Check positive required balance
            if BalanceManager.get_balance(orgid, currency).available < required_balances[currency]:
                raise BalanceManagerException('Insufficient balance to swap currencies: %s' % currency, 400)

        # Create settlements for all quotes
        source_settlements = []
        target_settlements = []

        for quote in parsed_quotes:
            # Create inbound settlement
            settlement_in = Settlement(
                initiator=orgid,
                beneficiary=SIMARD_ORGID,
                agent=agent,
                source='quote',
                amount=quote.source_amount,
                currency=quote.source_currency,
            )
            settlement_in.quote_uuid = quote.uuid

            # Create outbound settlement
            settlement_out = Settlement(
                initiator=SIMARD_ORGID,
                beneficiary=orgid,
                agent=agent,
                source='quote',
                amount=quote.target_amount,
                currency=quote.target_currency,
            )
            settlement_out.quote_uuid = quote.uuid

            # Execute quote, will raise an exception if it fails
            quote.execute()
            settlement_in.store()
            source_settlements.append(settlement_in.uuid)
            settlement_out.store()
            target_settlements.append(settlement_out.uuid)
            quote.store()

        return source_settlements, target_settlements
