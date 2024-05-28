from pytz import timezone as timezone_picker
from datetime import datetime
from iso4217 import Currency
from .text_tag import TextTag
from .meta_tag import MetaTag
from .exception import TADCException
from .monetary_amount import MonetaryAmount
from decimal import Decimal


class TADCCHotelException(TADCException):
    pass

DOCUMENT_DATE_FORMAT = "%Y-%m-%d"


class RoomRate(MetaTag):
    def __init__(self, room_rate: dict, currency: Currency, seq_num: int):

        super().__init__("RoomRate", [
            TextTag("RateNbr", str(seq_num).zfill(2)),
            TextTag(
                "DayRate",
                str(MonetaryAmount(currency, Decimal(room_rate["dayRateAmount"])))
            ),
            TextTag(
                "NightCnt", str(room_rate["nightCount"]).zfill(2)
            )
        ])

class RoomRateGrp(MetaTag):
    def __init__(self, room_rates: dict, currency: Currency):
        room_rates_tags = []
        for index, room_rate in enumerate(room_rates):
            room_rates_tags.append(
                RoomRate(
                    room_rate=room_rate,
                    currency=currency,
                    seq_num=index + 1,
                )
            )
        super().__init__("RoomRateGrp", room_rates_tags)


class Hotel(MetaTag):
    def __init__(self, component: dict, currency: Currency):
        self.component = component
        super().__init__("Hotel", [
            TextTag("FolioNbr", component["folioNumber"]),
            TextTag(
                "ChkInDt",
                datetime.strptime(
                    component["checkInDate"], DOCUMENT_DATE_FORMAT
                ).strftime("%Y%m%d"),
            ),
            TextTag(
                "ChkOutDt",
                datetime.strptime(
                    component["checkOutDate"], DOCUMENT_DATE_FORMAT
                ).strftime("%Y%m%d"),
            ),
            RoomRateGrp(self.component["roomRates"], currency)
        ])

    @property
    def destination(self):
        raise(TADCCHotelException("Not Implemented"))  # FIXME

    @property
    def departure_datetime(self):
        raise(TADCCHotelException("Not Implemented"))  # FIXME

    @property
    def supplier_name(self):
        raise(TADCCHotelException("Not Implemented"))  # FIXME
