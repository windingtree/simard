import unittest
from simard.travel_component import TravelComponent, TravelComponentException
from simard.hotel_component import HotelComponent, RoomRate, HotelComponentException, RoomRateException
from simard.air_component import AirComponent, AirSegment, AirComponentException, AirSegmentException
from model import TravelComponentAmounts
from unittest import mock
from decimal import Decimal


class TestTravelComponents(unittest.TestCase):
    def setUp(self):
        self.air_segments = [
            {
                "iataCode": "BA",
                "flightNumber": "1234",
                "serviceClass": "C",
                "origin": "LHR",
                "destination": "JFK",
                "departureTime": "2021-04-12T11:20:50.52Z",
                "arrivalTime": "2021-04-12T23:20:50.52Z"
            }
        ]

        self.hotel_room_rates = [
            {
                "dayRateAmount": "12500.00",
                "nightCount": 1
            }
        ]

        self.air_component_data = {
            "componentType": "air",
            "recordLocator": "ZU7CKB",
            "documentType": "TKT",
            "documentNumber": "00147568054247",
            "documentIssuanceDate": "2021-12-01",
            "segments": self.air_segments,
            "amounts": {
                "total": Decimal("123.45")
            },
            "contactEmails": ["john@doe.com"],
        }

        self.hotel_component_data = {
            "componentType": "hotel",
            "folioNumber": "BK2021061823",
            "checkInDate": "2021-04-12",
            "checkOutDate": "2021-04-13",
            "roomRates": self.hotel_room_rates,
            "amounts": {
                "total": Decimal("456.78")
            },
            "contactEmails": ["john@doe.com"],
        }

        self.travel_components_data = [
            self.air_component_data,
            self.hotel_component_data
        ]

    def test_air_segment_success(self):
        """
        Test creating an AirSegment object from a valid dictionary
        """

        segment = self.air_segments[0]

        s = AirSegment(
            iata_code=segment['iataCode'],
            flight_number=segment['flightNumber'],
            service_class=segment['serviceClass'],
            origin=segment['origin'],
            destination=segment['destination'],
            departure_time=segment['departureTime'],
            arrival_time=segment['arrivalTime']
        )

        self.assertEqual(s.iata_code, segment['iataCode'])
        self.assertEqual(s.flight_number, segment['flightNumber'])
        self.assertEqual(s.service_class, segment['serviceClass'])
        self.assertEqual(s.origin, segment['origin'])
        self.assertEqual(s.destination, segment['destination'])
        self.assertEqual(s.departure_time, segment['departureTime'])
        self.assertEqual(s.arrival_time, segment['arrivalTime'])

        self.assertEqual(s.get_dict(), segment)
        self.assertTrue(s.validate())

    def test_hotel_room_rate_success(self):
        """
        Test creating a RoomRate object from a valid dictionary
        """

        room_rate = self.hotel_room_rates[0]
        r = RoomRate(
            day_rate_amount=room_rate['dayRateAmount'],
            night_count=room_rate['nightCount']
        )

        self.assertEqual(r.day_rate_amount, room_rate['dayRateAmount'])
        self.assertEqual(r.night_count, room_rate['nightCount'])
        self.assertEqual(r.get_dict(), room_rate)
        self.assertTrue(r.validate())

    def test_air_component_success(self):
        """
        Test creating an AirComponent object from a valid dictionary
        """

        segments = []
        for segment in self.air_segments:
            s = AirSegment(
                iata_code=segment['iataCode'],
                flight_number=segment['flightNumber'],
                service_class=segment['serviceClass'],
                origin=segment['origin'],
                destination=segment['destination'],
                departure_time=segment['departureTime'],
                arrival_time=segment['arrivalTime']
            )

            segments.append(s)

        air_component = AirComponent(
            record_locator=self.air_component_data['recordLocator'],
            document_type=self.air_component_data['documentType'],
            document_number=self.air_component_data['documentNumber'],
            document_issuance_date=self.air_component_data['documentIssuanceDate'],
            segments=segments,
            amounts=TravelComponentAmounts(self.air_component_data['amounts']),
            contact_emails=self.air_component_data['contactEmails']
        )

        self.assertEqual(air_component.component_type, 'air')
        self.assertEqual(air_component.record_locator, self.air_component_data['recordLocator'])
        self.assertEqual(air_component.document_type, self.air_component_data['documentType'])
        self.assertEqual(air_component.document_number, self.air_component_data['documentNumber'])
        self.assertEqual(air_component.document_issuance_date, self.air_component_data['documentIssuanceDate'])
        self.assertEqual(air_component.segments, segments)
        self.assertEqual(air_component.contact_emails, self.air_component_data['contactEmails'])

        # self.assertEqual(air_component.get_dict(), self.air_component_data)
        self.assertDictContainsSubset(self.air_component_data, air_component.get_dict())
        self.assertTrue(air_component.validate())

    def test_hotel_component_success(self):
        """
        Test creating a HotelComponent object from a valid dictionary
        """

        room_rates = []
        for room_rate in self.hotel_room_rates:
            r = RoomRate(
                day_rate_amount=room_rate['dayRateAmount'],
                night_count=room_rate['nightCount']
            )
            self.assertEqual(r.day_rate_amount, room_rate['dayRateAmount'])
            self.assertEqual(r.night_count, room_rate['nightCount'])
            room_rates.append(r)

        hotel_component = HotelComponent(
            folio_number=self.hotel_component_data['folioNumber'],
            check_in_date=self.hotel_component_data['checkInDate'],
            check_out_date=self.hotel_component_data['checkOutDate'],
            room_rates=room_rates,
            amounts=TravelComponentAmounts(self.hotel_component_data['amounts'])
        )

        self.assertEqual(hotel_component.component_type, 'hotel')
        self.assertEqual(hotel_component.folio_number, self.hotel_component_data['folioNumber'])
        self.assertEqual(hotel_component.check_in_date, self.hotel_component_data['checkInDate'])
        self.assertEqual(hotel_component.check_out_date, self.hotel_component_data['checkOutDate'])
        self.assertEqual(hotel_component.room_rates, room_rates)
        self.assertEqual(hotel_component.contact_emails, self.hotel_component_data['contactEmails'])

        self.assertDictContainsSubset(self.hotel_component_data, hotel_component.get_dict())
        self.assertTrue(hotel_component.validate())

    # From dict test_cases
    def test_air_segment_from_dict(self):
        """
        Test creating an AirSegment object from a valid dictionary
        """
        segment = self.air_segments[0]
        s = AirSegment.from_dict(segment)

        self.assertEqual(s.iata_code, segment['iataCode'])
        self.assertEqual(s.flight_number, segment['flightNumber'])
        self.assertEqual(s.service_class, segment['serviceClass'])
        self.assertEqual(s.origin, segment['origin'])
        self.assertEqual(s.destination, segment['destination'])
        self.assertEqual(s.departure_time, segment['departureTime'])
        self.assertEqual(s.arrival_time, segment['arrivalTime'])

        self.assertEqual(s.get_dict(), segment)
        self.assertTrue(s.validate())

    def test_hotel_room_rate_from_dict(self):
        """
        Test creating a RoomRate object from a valid dictionary
        """
        room_rate = self.hotel_room_rates[0]
        r = RoomRate.from_dict(room_rate)

        self.assertEqual(r.day_rate_amount, room_rate['dayRateAmount'])
        self.assertEqual(r.night_count, room_rate['nightCount'])
        self.assertEqual(r.get_dict(), room_rate)
        self.assertTrue(r.validate())

    def test_hotel_component_from_dict(self):
        """
        Test creating a HotelComponent object from a valid dictionary
        """
        hotel_component = self.hotel_component_data
        h = HotelComponent.from_dict(hotel_component)

        self.assertEqual(h.component_type, 'hotel')
        self.assertEqual(h.folio_number, hotel_component['folioNumber'])
        self.assertEqual(h.check_in_date, hotel_component['checkInDate'])
        self.assertEqual(h.check_out_date, hotel_component['checkOutDate'])
        self.assertEqual(h.contact_emails, hotel_component['contactEmails'])
        self.assertEqual(
            [room_rate.get_dict() for room_rate in h.room_rates],
            hotel_component['roomRates']
        )

        self.assertDictContainsSubset(hotel_component, h.get_dict())
        self.assertTrue(h.validate())

    def test_air_component_from_dict(self):
        """
        Test creating an AirComponent object from a valid dictionary
        """
        air_component = self.air_component_data
        a = AirComponent.from_dict(air_component)

        self.assertEqual(a.component_type, 'air')
        self.assertEqual(a.record_locator, air_component['recordLocator'])
        self.assertEqual(a.document_type, air_component['documentType'])
        self.assertEqual(a.document_number, air_component['documentNumber'])
        self.assertEqual(a.document_issuance_date, air_component['documentIssuanceDate'])
        self.assertEqual(a.contact_emails, air_component['contactEmails'])
        self.assertEqual(
            [segment.get_dict() for segment in a.segments],
            air_component['segments']
        )

        self.assertDictContainsSubset(air_component, a.get_dict())
        self.assertTrue(a.validate())

    # Test missing keys in dict
    def test_air_segment_invalid_data(self):
        """
        Test creating an AirSegment object from an invalid dictionary
        """
        for key in self.air_segments[0].keys():
            segment = self.air_segments[0].copy()
            segment[key] = None
            self.assertFalse(AirSegment.from_dict(segment).validate())

            del segment[key]
            with self.assertRaises(AirSegmentException) as e:
                AirSegment.from_dict(segment)
                self.assertEqual(e.code, 400)

    def test_room_rate_invalid_data(self):
        """
        Test creating a RoomRate object from an invalid dictionary
        """
        for key in self.hotel_room_rates[0].keys():
            room_rate = self.hotel_room_rates[0].copy()
            room_rate[key] = None
            self.assertFalse(RoomRate.from_dict(room_rate).validate())

            del room_rate[key]
            with self.assertRaises(RoomRateException) as e:
                RoomRate.from_dict(room_rate)
                self.assertEqual(e.code, 400)

    def test_hotel_component_invalid_data(self):
        """
        Test creating a HotelComponent object from an invalid dictionary
        """
        for key in self.hotel_component_data.keys():
            # componentType is validated by he ComponentType class
            if key in ['componentType', 'amounts']:
                continue

            hotel_component = self.hotel_component_data.copy()
            hotel_component[key] = None
            # Room rates are iterable, so we need to check them separately
            if key != 'roomRates':
                self.assertFalse(HotelComponent.from_dict(hotel_component).validate())

            del hotel_component[key]
            with self.assertRaises(HotelComponentException) as e:
                HotelComponent.from_dict(hotel_component)
                self.assertEqual(e.code, 400)

    def test_air_component_invalid_data(self):
        """
        Test creating an AirComponent object from an invalid dictionary
        """
        for key in self.air_component_data.keys():
            # componentType is validated by he ComponentType class
            if key in ['componentType', 'amounts']:
                continue

            air_component = self.air_component_data.copy()
            air_component[key] = None
            # Segments are iterable, so we need to check them separately
            if key == 'documentNumber':
                with self.assertRaises(AirComponentException) as e:
                    AirComponent.from_dict(air_component)
                    self.assertEqual(e.code, 400)
            elif key != 'segments':
                self.assertFalse(AirComponent.from_dict(air_component).validate())

            del air_component[key]
            with self.assertRaises(AirComponentException) as e:
                AirComponent.from_dict(air_component)
                self.assertEqual(e.code, 400)
