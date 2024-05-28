from decimal import Decimal
from iso4217 import Currency
from .monetary_amount import MonetaryAmount
from .text_tag import TextTag
from .travel_transaction import TravelTransaction
from .meta_tag import MetaTag
from .message_trailer import CurrencyTot
from .batch_trailer import BatchTrailer
from typing import List


class BtchSeqNbr(TextTag):
    def __init__(self, travel_batch_sequence_number: int):
        super().__init__("BtchSeqNbr", str(travel_batch_sequence_number).zfill(8))


class ProviderNm(TextTag):
    def __init__(self):
        super().__init__("ProviderNm", "SIMARD")


class TrvlBtchCurrCd(TextTag):
    def __init__(self, currency: Currency):
        super().__init__("TrvlBtchCurrCd", currency.code)


class TravelBatch(MetaTag):
    def __init__(
        self,
        travel_batch_sequence_number: int,
        currency: Currency,
        travel_transactions: List[TravelTransaction]
    ):
        self.transaction_count = len(travel_transactions)
        self.currency = currency
        self.total_amount = Decimal(0)
        for travel_transaction in travel_transactions:
            self.total_amount += travel_transaction.amounts.total

        tags = [
            BtchSeqNbr(travel_batch_sequence_number),
            ProviderNm(),
            TrvlBtchCurrCd(currency)
        ]
        tags.extend(travel_transactions)
        tags.append(
            BatchTrailer(
                self.transaction_count,
                MonetaryAmount(currency=currency, amount=self.total_amount)
            )
        )
        super().__init__("TravelBatch", tags)

    @classmethod
    def from_aggregate_dict(
        cls,
        travel_batch_sequence_number: int,
        travel_transaction_sequence_cursor: int,
        mongo_dict: dict
    ):
        travel_transaction_list = TravelTransaction.from_aggregate_tokens_list(
            travel_transaction_sequence_cursor=travel_transaction_sequence_cursor,
            mongo_tokens_list=mongo_dict['tokens'],
        )
        return cls(
            travel_batch_sequence_number=travel_batch_sequence_number,
            currency=Currency(mongo_dict['_id']),
            travel_transactions=travel_transaction_list,
        )

    @classmethod
    def from_aggregate_list(
        cls,
        travel_batch_sequence_cursor: int,
        travel_transaction_sequence_cursor: int,
        mongo_list: list
    ):
        batches = []
        travel_batch_sequence_number = travel_batch_sequence_cursor
        next_travel_transaction_sequence_cursor = travel_transaction_sequence_cursor
        for mongo_dict in mongo_list:
            travel_batch_sequence_number = travel_batch_sequence_number + 1
            travel_batch = TravelBatch.from_aggregate_dict(
                travel_batch_sequence_number=travel_batch_sequence_number,
                travel_transaction_sequence_cursor=next_travel_transaction_sequence_cursor,
                mongo_dict=mongo_dict
            )
            batches.append(travel_batch)
            next_travel_transaction_sequence_cursor += len(travel_batch.tags)
        return batches

    @property
    def currency_total(self) -> CurrencyTot:
        return CurrencyTot(
            currency=self.currency,
            transactions_count=self.transaction_count,
            transactions_total=MonetaryAmount(currency=self.currency, amount=self.total_amount)
        )
