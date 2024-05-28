from .travel_component_base import TravelComponentBase, TravelComponentException
from .hotel_component import HotelComponent, RoomRate
from .air_component import AirComponent, AirSegment
from model.exception import SimardException
from typing import List
import re


class TravelComponent(TravelComponentBase):
    def __init__(self):
        super().__init__('generic')

    @staticmethod
    def from_dict(data):
        components = {
            'air': AirComponent.from_dict,
            'hotel': HotelComponent.from_dict
        }

        if 'componentType' not in data.keys():
            raise TravelComponentException('componentType is required', 400)

        if data['componentType'] not in components.keys():
            raise TravelComponentException(
                'componentType must be one of [{}]'.format(', '.join(components.keys())),
                400
            )

        return components[data['componentType']](data)

    @staticmethod
    def from_list_dict(travel_components_list_dict):
        travel_components = []
        for travel_component_dict in travel_components_list_dict:
            travel_components.append(TravelComponent.from_dict(travel_component_dict))
        return travel_components
