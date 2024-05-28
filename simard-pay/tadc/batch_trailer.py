from .text_tag import TextTag
from .meta_tag import MetaTag
from .monetary_amount import MonetaryAmount

class BtchDbCnt(TextTag):
    def __init__(self, count: int):
        super().__init__("BtchDbCnt", str(count).zfill(9))


class BtchDbTot(TextTag):
    def __init__(self, total: MonetaryAmount):
        super().__init__("BtchDbTot", total.zfill(13))


class BtchCrCnt(TextTag):
    def __init__(self):
        super().__init__("BtchCrCnt", "0" * 9)


class BtchCrTot(TextTag):
    def __init__(self):
        super().__init__("BtchCrTot", "0" * 13)


class BtchCnt(TextTag):
    def __init__(self, count: int):
        super().__init__("BtchCnt", str(count).zfill(9))


class BtchTot(TextTag):
    def __init__(self, total: MonetaryAmount):
        super().__init__("BtchTot", total.zfill(13))


class BtchDbCrInd(TextTag):
    def __init__(self):
        super().__init__("BtchDbCrInd", "D")


class BatchTrailer(MetaTag):
    def __init__(self, transactions_count: int, total_amount: MonetaryAmount):
        super().__init__("BatchTrailer", [
            BtchDbCnt(transactions_count),
            BtchDbTot(total_amount),
            BtchCrCnt(),
            BtchCrTot(),
            BtchCnt(transactions_count),
            BtchTot(total_amount),
            BtchDbCrInd()
        ])
