import airportsdata
from pytz import timezone as timezone_picker
from .exception import SimardException

class AirportException(SimardException):
    pass

airports_data = airportsdata.load('IATA')

class Airport(object):
    def __init__(self, iata_code: str, name: str, country: str, city: str, timezone_name: str):
        self.iata_code = iata_code
        self.name = name
        self.country = country
        self.city = city
        self.timezone = timezone_picker(timezone_name)

    @classmethod
    def from_dict(cls, airport_dict: dict):
        return cls(
            iata_code=airport_dict["iata"],
            name=airport_dict["name"],
            country=airport_dict["country"],
            city=airport_dict["city"],
            timezone_name=airport_dict["tz"],
        )

    @classmethod
    def from_iata_code(cls, iata_code: str):
        if iata_code not in airports_data:
            raise AirportException('Unknown airport code: %s' % iata_code, 400)
        return Airport.from_dict(airports_data[iata_code])
