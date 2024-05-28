from .text_tag import TextTag
from .meta_tag import MetaTag
from iso4217 import Currency
from .monetary_amount import MonetaryAmount
from typing import List

class CurrencyTot(MetaTag):
    def __init__(self, currency: Currency, transactions_count: int, transactions_total: MonetaryAmount):
        tags = [
            TextTag("CurrencyCd", currency.code),
            TextTag("TravelTranDbCnt", str(transactions_count).zfill(9)),
            TextTag("TravelTranDbTot", transactions_total.zfill(13)),
            TextTag("TravelTranCrCnt", "0" * 9),
            TextTag("TravelTranCrTot", "0" * 13),
            TextTag("TravelTranCnt", str(transactions_count).zfill(9)),
            TextTag("TravelTranTot", transactions_total.zfill(13)),
            TextTag("TravelDbCrInd", "D"),
            TextTag("SettleTranDbCnt", "0" * 9),
            TextTag("SettleTranDbTot", "0" * 13),
            TextTag("SettleTranCrCnt", "0" * 9),
            TextTag("SettleTranCrTot", "0" * 13),
            TextTag("SettleTranCnt", "0" * 9),
            TextTag("SettleTranTot", "0" * 13),
            TextTag("SettleDbCrInd", "D")
        ]
        super().__init__("CurrencyTot", tags)

class CurrencyTotGrp(MetaTag):
    def __init__(self, currency_totals: List[CurrencyTot]):
        super().__init__("CurrencyTotGrp", currency_totals)

class MessageTrailer(MetaTag):
    def __init__(self, travel_batch_count: int, currency_totals: List[CurrencyTot]):

        tags = [
            TextTag("SettleBtchCnt", "0" * 9),
            TextTag("TrvlBtchCnt", str(travel_batch_count).zfill(9)),
            CurrencyTotGrp(currency_totals)
        ]
        super().__init__("MessageTrailer", tags)
