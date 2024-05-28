from datetime import datetime
from .text_tag import TextTag
from .meta_tag import MetaTag
from .exception import TADCException
from model import Airport, Airline, AirlineException
from typing import List
from dateutil import parser

class TADCAirException(TADCException):
    pass

DOCUMENT_DATE_FORMAT = "%Y-%m-%d"


class AirSector(MetaTag):
    def __init__(self, segment: dict, seq_num: int):
        origin_airport = Airport.from_iata_code(segment["origin"])
        destination_airport = Airport.from_iata_code(segment["destination"])
        is_domestic = (origin_airport.country == destination_airport.country)

        departure_datetime = parser.isoparse(segment["departureTime"]).astimezone(origin_airport.timezone)
        arrival_datetime = parser.isoparse(segment["arrivalTime"]).astimezone(destination_airport.timezone)

        super().__init__("AirSector", [
            TextTag("SctrNbr", str(seq_num).zfill(2)),
            TextTag("SctrTypeCd", "A"),
            TextTag("DprtAirCd", origin_airport.iata_code),
            TextTag("ArrAirCd", destination_airport.iata_code),
            TextTag("DprtDt", departure_datetime.strftime("%Y%m%d")),
            TextTag("DprtTm", departure_datetime.strftime("%H%M%S")),
            TextTag("ArrDt", arrival_datetime.strftime("%Y%m%d")),
            TextTag("ArrTm", arrival_datetime.strftime("%H%M%S")),
            TextTag("FlightNbr", segment["flightNumber"].zfill(4)),
            TextTag("SctrClassCd", segment["serviceClass"]),
            TextTag("CarrierCd", segment["iataCode"]),
            TextTag("DomesticInd", "Y" if is_domestic else "N"),
        ])


class AirSectorGrp(MetaTag):
    def __init__(self, segments: List):
        air_sectors = []
        for index, sector in enumerate(segments):
            air_sectors.append(AirSector(sector, index + 1))
        super().__init__('AirSectorGrp', air_sectors)


class Air(MetaTag):
    def __init__(self, component: dict):
        super().__init__("Air", [
            TextTag("TktNbr", component["documentNumber"]),
            TextTag("PNRLocCd", component['recordLocator']),
            TextTag("AirTransTypeCd", component["documentType"]),
            TextTag(
                "TktIssDt",
                datetime.strptime(
                    component["documentIssuanceDate"], DOCUMENT_DATE_FORMAT
                ).strftime("%Y%m%d"),
            ),
            TextTag("ETktInd", "Y"),
            AirSectorGrp(component["segments"])
        ])
        self.component = component

    @property
    def destination(self):
        segments = self.component["segments"]
        origin = segments[0]['origin']
        for i in range(0, len(segments)):
            destination = segments[len(segments) - i - 1]['destination']
            if origin == destination:
                continue
            return Airport.from_iata_code(destination).city

    @property
    def departure_datetime(self):
        origin_airport_iata_code = self.component["segments"][0]["origin"]
        origin_airport = Airport.from_iata_code(origin_airport_iata_code)
        departure_datetime = parser.isoparse(self.component["segments"][0]["departureTime"])
        return departure_datetime.astimezone(origin_airport.timezone)

    @property
    def supplier_name(self):
        try:
            return Airline.from_iata_num(self.component["documentNumber"][:3]).name
        except AirlineException as e:
            raise TADCAirException('Can not determine airline name from document number') from e
