"""
Define a manager class to manage quotes objects
"""
from simard.quote import Quote
from model.exception import SimardException
from simard.parser import Parser


class QuoteManagerException(SimardException):
    pass


class QuoteManager(object):

    @staticmethod
    def create_quote(orgid, agent, source_currency, target_currency, source_amount=None, target_amount=None):
        """
        Create a quote for an orgid
        """
        # Parse all fields for security
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        source_currency = Parser.parse_currency(source_currency)
        target_currency = Parser.parse_currency(target_currency)
        if source_amount is not None:
            source_amount = Parser.parse_amount(source_amount)
        if target_amount is not None:
            target_amount = Parser.parse_amount(target_amount)

        # Check if we have exactly one amount
        if (source_amount is None) and (target_amount is None):
            raise QuoteManagerException('Quote requires source or target amount', 400)

        # Check if we have exactly one amount
        if (source_amount is not None) and (target_amount is not None):
            raise QuoteManagerException('Quote requires either source or target amount', 400)

        quote = Quote(
            orgid=orgid,
            agent=agent,
            source_amount=source_amount,
            source_currency=source_currency,
            target_amount=target_amount,
            target_currency=target_currency,
        )
        quote.create_transferwise()
        quote.store()

        return quote

    @staticmethod
    def get_quote(orgid, agent, quote_uuid):
        """
        Get a quote for its id
        """
        # Parse all fields for security
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        quote_uuid = Parser.parse_uuid(quote_uuid)

        # Retrieve Quote
        quote = Quote.from_storage(quote_uuid)

        # Check if quote exists
        if quote is None:
            raise QuoteManagerException('Quote not found', 404)

        # Check if the quote owner is the same
        if quote.orgid != orgid:
            raise QuoteManagerException('Quote is owned by another organization', 403)

        return quote

    @staticmethod
    def execute_transfer(orgid, agent, quote_uuid):
        """
        Execute a transfer and mark a quote as used
        """
        # Retrieve quote
        quote = QuoteManager.get_quote(orgid, agent, quote_uuid)

        # Use the quote and savve
        quote.execute()
        quote.store()
