from iso4217 import Currency
from pytz import timezone as timezone_picker
from datetime import datetime
from .monetary_amount import MonetaryAmount
from .text_tag import TextTag
from .commodity import Commodity
from .card_token import CardToken
from .meta_tag import MetaTag
from model import CustomerReferences, TravelComponentAmounts
from uuid import UUID
import base64
from decimal import Decimal


class TransSeqNbr(TextTag):
    def __init__(self, seq_num: int):
        super().__init__("TransSeqNbr", str(seq_num).zfill(9))


class TransDt(TextTag):
    def __init__(self, transaction_datetime: datetime):
        super().__init__("TransDt", transaction_datetime.strftime("%Y%m%d"))


class TransTm(TextTag):
    def __init__(self, transaction_datetime: datetime):
        super().__init__("TransTm", transaction_datetime.strftime("%H%M%S"))


class CommodityCd(TextTag):
    def __init__(self, code):
        super().__init__("CommodityCd", code)


class AddAmount(MetaTag):
    def __init__(self, type_code: int, amount: MonetaryAmount, percentage_rate: Decimal = None):
        tags = [
            TextTag("AmtTypeCd", str(type_code).zfill(3)),
            TextTag("AddAmt", amount.zfill(12)),
            TextTag("DbCrInd", "D"),
        ]
        if percentage_rate is not None:
            tags.append(TextTag("AddAmtRt", str(percentage_rate)))

        super().__init__("AddAmount", tags)

class AddAmountGrp(MetaTag):
    def __init__(self, travel_component_amounts: TravelComponentAmounts, currency: Currency):
        add_amount_tags = []
        if travel_component_amounts.taxes is not None:
            for tax_item in travel_component_amounts.taxes:
                if tax_item.is_value_added:
                    add_monetary_amount = MonetaryAmount(currency, tax_item.amount)
                    add_amount_tag = AddAmount(57, add_monetary_amount, tax_item.percentage_rate)
                    add_amount_tags.append(add_amount_tag)

        super().__init__("AddAmountGrp", add_amount_tags)


class Trip(MetaTag):
    def __init__(
        self,
        destination_name: str,
        departure_datetime: datetime,
        traveller_last_name: str = None,
        traveller_first_name: str = None,
    ):
        super().__init__("Trip", [
            TextTag("DestNm", destination_name[:20]),
            TextTag("DprtDt", departure_datetime.strftime("%Y%m%d")),
            TextTag("TvlrFirstNm", traveller_first_name or "MISSING"),
            TextTag("TvlrLastNm", traveller_last_name or "MISSING"),
        ])

class Supplier(MetaTag):
    def __init__(self, supplier_name: str, vat_number: str = None):
        tags = [TextTag("SuplrNm", supplier_name[:20])]
        if vat_number:
            tags.append(TextTag("VATNbr", vat_number[:30])),
        super().__init__("Supplier", tags)


class Account(MetaTag):
    def __init__(self, account_number: str, expiry_date: str):
        super().__init__("Account", [
            TextTag("AcctNbr", account_number),
            TextTag("CrdExpDt", expiry_date),
        ])


class Amount(MetaTag):
    def __init__(self, amount: MonetaryAmount):
        super().__init__("Amount", [
            TextTag("TransAmt", str(amount)),
            TextTag("DbCrInd", "D"),
        ])


class Provider(MetaTag):
    def __init__(self, token_id: UUID):
        token_reference = base64.b64encode(token_id.bytes).decode()
        super().__init__("Provider", [
            TextTag("IATANbr", "63320235"),
            TextTag("AmexAgcyNbr", "SI53"),
            TextTag("AmexOfcNbr", "032581525"),
            TextTag("InvInd", "N"),
            TextTag("InvNbr", "DUMMY"),
            TextTag("InvDt", "20000101"),
            TextTag("ProviderTransRefDa", token_reference),
        ])

class CustRef(MetaTag):
    def __init__(self, number: int, type_code: int, value: str):
        super().__init__("CustRef", [
            TextTag("CustRefNbr", str(number).zfill(2)),
            TextTag("CustRefTypeCd", str(type_code).zfill(4)),
            TextTag("CustRefTx", value),
        ])

class CustRefGrp(MetaTag):
    def __init__(self, customer_references: CustomerReferences):
        cust_refs = []
        if customer_references.cost_center:
            cust_refs.append(CustRef(1, 1, customer_references.cost_center[:9]))
        if customer_references.approver_last_name:
            approver_name = customer_references.approver_last_name
            if customer_references.approver_first_name:
                approver_name += " " + customer_references.approver_first_name
            cust_refs.append(CustRef(2, 3, approver_name[:24]))
        if customer_references.employee_id:
            cust_refs.append(CustRef(3, 2, customer_references.employee_id[:10]))
        if customer_references.job_number:
            cust_refs.append(CustRef(4, 4, customer_references.job_number[:10]))
        if customer_references.project_code:
            cust_refs.append(CustRef(5, 5, customer_references.project_code[:15]))
        if customer_references.business_unit:
            cust_refs.append(CustRef(6, 6, customer_references.project_code[:5]))

        super().__init__("CustRefGrp", cust_refs)

class TravelTransaction(MetaTag):
    def __init__(
        self,
        travel_transaction_sequence_number: int,
        card_token: CardToken,
        component: dict
    ):

        # Token expiry date
        expiry_date = (
            card_token.card_data.expiry_month + card_token.card_data.expiry_year[2:]
        )

        # Determine transaction datetime
        transaction_datetime = datetime.fromtimestamp(
            component["createdAt"], timezone_picker("Europe/Tallinn")
        )

        # Create amounts
        amounts_dict = component['amounts'] if 'amounts' in component else {'total': card_token.amount.amount}
        self.amounts = TravelComponentAmounts(amounts_dict)
        total_monetary_amount = MonetaryAmount(card_token.currency, self.amounts.total)

        # Create commodity details
        commodity = Commodity(component, card_token.currency)

        # Create tags
        tags = [
            TextTag("TransSeqNbr", str(travel_transaction_sequence_number).zfill(9)),
            TransDt(transaction_datetime),
            TransTm(transaction_datetime),
            TextTag("MediaCd", "04"),
            CommodityCd(commodity.commodity_code),
            Account(
                card_token.card_data.alias_cc,
                expiry_date
            ),
            Amount(total_monetary_amount),
            Trip(
                commodity.destination,
                commodity.departure_datetime,
                card_token.customer_references.traveller_last_name,
                card_token.customer_references.traveller_first_name,
            ),
            Supplier(commodity.supplier_name),
            Provider(card_token.uuid),
        ]

        if card_token.customer_references.has_tadc_references():
            tags.append(CustRefGrp(card_token.customer_references))

        tags.extend([
            AddAmountGrp(self.amounts, card_token.currency),
            commodity
        ])

        super().__init__("TravelTran", tags)

    @classmethod
    def from_aggregate_component_dict(cls, travel_transaction_sequence_number: int, card_token: CardToken, mongo_component_dict: dict):
        return cls(
            travel_transaction_sequence_number=travel_transaction_sequence_number,
            card_token=card_token,
            component=mongo_component_dict
        )

    @classmethod
    def from_aggregate_tokens_list(cls, travel_transaction_sequence_cursor: int, mongo_tokens_list: list):
        travel_transactions = []
        travel_transaction_sequence_number = travel_transaction_sequence_cursor

        # Get all Tokens in the list
        for mongo_token_dict in mongo_tokens_list:
            # Unpack the Card Token
            card_token = CardToken.from_aggregate_dict(mongo_token_dict)

            # Unpack the travel components as Travel Transactions
            for travel_component_dict in mongo_token_dict['travelComponents']:
                # Skip Hotels as not implemented - FIXME
                if travel_component_dict['componentType'] == 'hotel':
                    continue

                # Build the travel transaction from the dict
                travel_transaction_sequence_number += 1
                travel_transaction = TravelTransaction.from_aggregate_component_dict(
                    travel_transaction_sequence_number=travel_transaction_sequence_number,
                    card_token=card_token,
                    mongo_component_dict=travel_component_dict
                )
                travel_transactions.append(travel_transaction)

        return travel_transactions
