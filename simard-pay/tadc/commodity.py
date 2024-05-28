from iso4217 import Currency
from .meta_tag import MetaTag
from .exception import TADCException
from .air import Air
from .hotel import Hotel


class TADCCommodityException(TADCException):
    pass

DOCUMENT_DATE_FORMAT = "%Y-%m-%d"


class Commodity(MetaTag):
    def __init__(self, component: dict, currency: Currency):
        self.component = component

        if self.component["componentType"] == "air":
            self.commodity_code = "001"
            super().__init__("Commodity", [Air(component)])

        # Hotel Specific mappings
        elif self.component["componentType"] == "hotel":
            self.commodity_code = "004"
            super().__init__("Commodity", [Hotel(component, currency)])

        else:
            raise TADCCommodityException(
                "Unknown component type {}".format(
                    self.component["componentType"]
                )
            )

    @property
    def destination(self):
        return self.tags[0].destination

    @property
    def departure_datetime(self):
        return self.tags[0].departure_datetime

    @property
    def supplier_name(self):
        return self.tags[0].supplier_name
