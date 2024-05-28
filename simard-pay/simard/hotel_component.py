from model import TravelComponentAmounts
from .travel_component_base import TravelComponentBase, TravelComponentException
from model.exception import SimardException
from typing import List
import re

class HotelComponentException(TravelComponentException):
    pass

class RoomRateException(HotelComponentException):
    pass


class RoomRate():
    def __init__(self, day_rate_amount, night_count):
        self.day_rate_amount = day_rate_amount
        self.night_count = night_count

    @classmethod
    def from_dict(cls, data: dict):
        try:
            return cls(
                day_rate_amount=data['dayRateAmount'],
                night_count=data['nightCount']
            )
        except KeyError as e:
            raise RoomRateException(f'Missing key {e}', 400)

    def get_dict(self) -> dict:
        return {
            "dayRateAmount": self.day_rate_amount,
            "nightCount": self.night_count
        }

    def validate(self) -> bool:
        rules = {
            self.day_rate_amount: '^[0-9]+(.[0-9]+)?$',
            self.night_count: '^[0-9]+$'
        }

        for key, value in rules.items():
            if not re.match(value, str(key)):
                return False
        return True


class HotelComponent(TravelComponentBase):
    def __init__(
        self,
        folio_number,
        check_in_date,
        check_out_date,
        room_rates: List[RoomRate],
        contact_email,
        amounts: TravelComponentAmounts = None,
        uuid=None,
        created_at=None,
        updated_at=None
    ):
        super().__init__(component_type='hotel', uuid=uuid, created_at=created_at, updated_at=updated_at,
                         contact_email=contact_email)
        self.folio_number = folio_number
        self.check_in_date = check_in_date
        self.check_out_date = check_out_date
        self.room_rates = room_rates
        self.amounts = amounts

    @classmethod
    def from_dict(cls, data):
        keys = ['folioNumber', 'checkInDate', 'checkOutDate', 'roomRates', 'contactEmail']
        for key in keys:
            if key not in data:
                raise HotelComponentException(f'Missing key {key}', 400)

        room_rates = [
            RoomRate.from_dict(room_rate)
            for room_rate in data['roomRates']
        ]

        amounts = None
        if 'amounts' in data:
            amounts = TravelComponentAmounts(data['amounts'])

        return cls(
            folio_number=data['folioNumber'],
            check_in_date=data['checkInDate'],
            check_out_date=data['checkOutDate'],
            room_rates=room_rates,
            contact_email=data['contactEmail'],
            amounts=amounts
        )

    def get_dict(self):
        component_dict = {
            'id': self.uuid,
            'createdAt': self.created_at,
            'componentType': self.component_type,
            'folioNumber': self.folio_number,
            'checkInDate': self.check_in_date,
            'checkOutDate': self.check_out_date,
            'roomRates': [room_rate.get_dict() for room_rate in self.room_rates],
            'contactEmail': self.contact_email,
        }

        if self.amounts is not None:
            component_dict['amounts'] = self.amounts.to_dict()

        return component_dict

    def validate(self):
        rules = {
            self.folio_number: '^[A-Z0-9]+$',
            self.check_in_date: self.date_regex_rule,
            self.check_out_date: self.date_regex_rule
        }

        for key, value in rules.items():
            if not re.match(value, str(key)):
                return False

        return all([room_rate.validate() for room_rate in self.room_rates])
