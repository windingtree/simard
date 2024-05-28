from .travel_component_base import TravelComponentBase, TravelComponentException
from model import TravelComponentAmounts, Airline
from typing import List
import re

class AirComponentException(TravelComponentException):
    pass

class AirSegmentException(AirComponentException):
    pass

class AirSegment():
    def __init__(
        self,
        iata_code,
        flight_number,
        service_class,
        origin,
        destination,
        departure_time,
        arrival_time
    ):
        self.iata_code = iata_code
        self.flight_number = flight_number
        self.service_class = service_class
        self.origin = origin
        self.destination = destination
        self.departure_time = departure_time
        self.arrival_time = arrival_time

    @classmethod
    def from_dict(cls, data):
        try:
            return cls(
                iata_code=data['iataCode'],
                flight_number=data['flightNumber'],
                service_class=data['serviceClass'],
                origin=data['origin'],
                destination=data['destination'],
                departure_time=data['departureTime'],
                arrival_time=data['arrivalTime']
            )
        except KeyError as e:
            raise AirSegmentException(f'Missing key: {e}', 400)

    def get_dict(self):
        return {
            "iataCode": self.iata_code,
            "flightNumber": self.flight_number,
            "serviceClass": self.service_class,
            "origin": self.origin,
            "destination": self.destination,
            "departureTime": self.departure_time,
            "arrivalTime": self.arrival_time
        }

    def validate(self):
        timestamp_regex = '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{2,3}Z$'

        rules = {
            self.iata_code: '^[A-Z0-9]{2}$',
            self.flight_number: '^[0-9]{4}$',
            self.service_class: '^[A-Z]{1,2}$',
            self.origin: '^[A-Z]{3}$',
            self.destination: '^[A-Z]{3}$',
            self.departure_time: timestamp_regex,
            self.arrival_time: timestamp_regex
        }

        for key, value in rules.items():
            if not re.match(value, str(key)):
                return False

        return True


class AirComponent(TravelComponentBase):
    def __init__(
        self,
        record_locator,
        document_type,
        document_number,
        document_issuance_date,
        contact_email,
        segments: List[AirSegment],
        amounts: TravelComponentAmounts = None,
        uuid=None,
        created_at=None,
        updated_at=None,
    ):
        super().__init__(component_type='air', uuid=uuid, created_at=created_at, updated_at=updated_at, contact_email=contact_email)
        self.record_locator = record_locator
        self.document_type = document_type
        self.document_number = document_number
        self.document_issuance_date = document_issuance_date
        self.segments = segments
        self.amounts = amounts

    @classmethod
    def from_dict(cls, data: dict):
        keys = ['recordLocator', 'documentType', 'documentNumber', 'documentIssuanceDate', 'segments', 'amounts', 'contactEmail']

        for key in keys:
            if key not in data:
                raise AirComponentException(f'Missing key: {key}', 400)

        segments = [
            AirSegment.from_dict(segment)
            for segment in data['segments']
        ]

        if not Airline.is_valid_document(data['documentNumber']):
            raise AirComponentException("Invalid ticket number: %s" % data['documentNumber'], 400)

        return cls(
            record_locator=data['recordLocator'],
            document_type=data['documentType'],
            document_number=data['documentNumber'],
            document_issuance_date=data['documentIssuanceDate'],
            contact_email=data['contactEmail'],
            segments=segments,
            amounts=TravelComponentAmounts(data['amounts']),
        )

    def get_dict(self):
        air_component_dict = {
            'createdAt': self.created_at,
            'uuid': self.uuid,
            'componentType': self.component_type,
            'recordLocator': self.record_locator,
            'documentType': self.document_type,
            'documentNumber': self.document_number,
            'documentIssuanceDate': self.document_issuance_date,
            'segments': [segment.get_dict() for segment in self.segments],
            'contactEmail': self.contact_email
        }

        if self.amounts:
            air_component_dict['amounts'] = self.amounts.to_dict()

        return air_component_dict

    def validate(self):
        rules = {
            self.record_locator: '^[A-Z0-9]{6}$',
            self.document_type: '^(TKT|EMD)$',
            self.document_number: '^[0-9]{14}$',
            self.document_issuance_date: self.date_regex_rule
        }

        for key, value in rules.items():
            if not re.match(value, str(key)):
                return False

        # Additional checks on document, e.g. must be a valid airline code
        if not Airline.is_valid_document(self.document_number):
            return False

        return all([segment.validate() for segment in self.segments])
