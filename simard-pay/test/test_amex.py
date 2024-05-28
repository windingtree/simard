import unittest
from decimal import Decimal

import mongomock
from iso4217 import Currency

from model import CustomerReferences
from simard.air_component import AirSegment
from simard.amex import Amex, AmexReconciliationFields
from simard.db import db
from simard.travel_component import TravelComponent


class TestAmex(unittest.TestCase):

    def setUp(self):
        db._database = mongomock.MongoClient().unittest

    def test_format_amount_to_amex_type(self):
        self.assertEqual('100', Amex.format_amount_to_amex_type(Decimal('1.00'), Currency('USD')))
        self.assertEqual('155', Amex.format_amount_to_amex_type(Decimal('1.55'), Currency('USD')))

    def test_add_decimal_point(self):
        self.assertEqual('1.00', Amex.add_decimal_point(Decimal('100'), Currency('USD')))
        self.assertEqual('1.55', Amex.add_decimal_point(Decimal('155'), Currency('USD')))

    def test_generate_token_reference_id(self):
        self.assertEqual(14, len(Amex.generate_token_reference_id()))


class TestAmexReconciliationFields(unittest.TestCase):
    travel_account_data = {
        "costCenter": "cc123",
        "businessUnit": "123",
        "projectCode": "pc123",
        "jobNumber": "jn123",
        "employeeId": "eid123",
        "travellerType": "employee",
        "approverLastName": "Levine",
        "approverFirstName": "Adam",
        "travellerLastName": "Doe",
        "travellerFirstName": "John"
    }

    travel_component_data = [
        {
            "componentType": "air",
            "documentType": "TKT",
            "documentNumber": "00123691513503",
            "recordLocator": "WKAHTQ",
            "documentIssuanceDate": "2023-03-17",
            "contactEmail": "one@email.com",
            "segments": [
                {
                    "arrivalTime": "2023-04-15T16:01:00.000Z",
                    "departureTime": "2023-04-15T11:59:00.000Z",
                    "destination": "DFW",
                    "origin": "JFK",
                    "flightNumber": "0860",
                    "iataCode": "AA",
                    "serviceClass": "Y"
                }
            ],
            "amounts": {
                "total": "230.80",
                "base": "186.98",
                "taxes": []
            }
        }
    ]

    def test_build_reconciliation_fields_with_empty_parameters(self):
        fields = AmexReconciliationFields.build_reconciliation_fields(None, None)
        as_dict = fields.to_dict()
        expected = {'user_defined_fields_group': [],
                    'accounting_fields_group': []}
        self.assertDictEqual(expected, as_dict)

    def test_build_reconciliation_fields_with_customer_references_only(self):
        customer_references = CustomerReferences(self.travel_account_data)
        fields = AmexReconciliationFields.build_reconciliation_fields(None, customer_references)
        self.assertEqual(customer_references.project_code, fields.user9)
        self.assertEqual(customer_references.employee_id, fields.user10)
        self.assertEqual('employee', fields.user11)
        self.assertEqual(customer_references.approver_last_name, fields.user12)
        self.assertEqual(customer_references.traveller_last_name, fields.accounting1)
        self.assertEqual(customer_references.traveller_first_name, fields.accounting2)

        as_dict = fields.to_dict()
        expected = {'user_defined_fields_group': [{'index': '9', 'value': customer_references.project_code},
                                                  {'index': '10', 'value': customer_references.employee_id},
                                                  {'index': '11', 'value': 'employee'},
                                                  {'index': '12', 'value': customer_references.approver_last_name}],
                    'accounting_fields_group': [{'index': '1', 'value': customer_references.traveller_last_name},
                                                {'index': '2', 'value': customer_references.traveller_first_name}]}
        self.assertDictEqual(expected, as_dict)

    def test_build_reconciliation_fields_with_travel_components_only(self):
        travel_components = [TravelComponent.from_dict(self.travel_component_data[0])]
        fields = AmexReconciliationFields.build_reconciliation_fields(travel_components, None)
        self.assertEqual(self.travel_component_data[0]['recordLocator'], fields.user3)
        as_dict = fields.to_dict()
        expected = {
            'user_defined_fields_group': [{'index': '1', 'value': 'one@email.com'},
                                          {'index': '3', 'value': 'WKAHTQ'},
                                          {'index': '4', 'value': '2023-04-15'}],
            'accounting_fields_group': [{'index': '4', 'value': 'air'},
                                        {'index': '5', 'value': 'JFK'},
                                        {'index': '6', 'value': '00123691513503'}]}

        self.assertDictEqual(expected, as_dict)

    def test_determine_itinerary_destination_oneway(self):
        direct_ow = [
            AirSegment.from_dict({
                "iataCode": "BA",
                "flightNumber": "1234",
                "serviceClass": "C",
                "origin": "LHR",
                "destination": "JFK",
                "departureTime": "2021-04-12T11:20:50.52Z",
                "arrivalTime": "2021-04-12T23:20:50.52Z"
            })
        ]
        self.assertEqual("JFK", AmexReconciliationFields._determine_itinerary_destination(direct_ow))

        connecting_ow = [
            AirSegment.from_dict({
                "iataCode": "BA",
                "flightNumber": "1234",
                "serviceClass": "C",
                "origin": "LHR",
                "destination": "JFK",
                "departureTime": "2021-04-12T11:20:50.52Z",
                "arrivalTime": "2021-04-12T23:20:50.52Z"
            }),
            AirSegment.from_dict({
                "iataCode": "BA",
                "flightNumber": "2222",
                "serviceClass": "C",
                "origin": "JFK",
                "destination": "LAX",
                "departureTime": "2021-04-13T06:20:00.00Z",
                "arrivalTime": "2021-04-13T12:20:00.00Z"
            })
        ]
        self.assertEqual("LAX", AmexReconciliationFields._determine_itinerary_destination(connecting_ow))
    def test_determine_itinerary_destination_roundtrip(self):
        direct_rt = [
            AirSegment.from_dict({
                "iataCode": "BA",
                "flightNumber": "1234",
                "serviceClass": "C",
                "origin": "LHR",
                "destination": "JFK",
                "departureTime": "2021-04-12T11:20:50.52Z",
                "arrivalTime": "2021-04-12T23:20:50.52Z"
            }),
            AirSegment.from_dict({
                "iataCode": "BA",
                "flightNumber": "2222",
                "serviceClass": "C",
                "origin": "JFK",
                "destination": "LHR",
                "departureTime": "2021-04-13T06:20:00.52Z",
                "arrivalTime": "2021-04-13T12:20:00.52Z"
            })
        ]
        self.assertEqual("JFK", AmexReconciliationFields._determine_itinerary_destination(direct_rt))

        connecting_rt = [
            AirSegment.from_dict({
                "iataCode": "BA",
                "flightNumber": "1234",
                "serviceClass": "C",
                "origin": "LHR",
                "destination": "JFK",
                "departureTime": "2021-04-12T11:20:50.00Z",
                "arrivalTime": "2021-04-12T23:20:50.00Z"
            }),
            AirSegment.from_dict({
                "iataCode": "BA",
                "flightNumber": "2222",
                "serviceClass": "C",
                "origin": "JFK",
                "destination": "LAX",
                "departureTime": "2021-04-13T06:20:00.00Z",
                "arrivalTime": "2021-04-13T12:20:00.00Z"
            }),
            AirSegment.from_dict({
                "iataCode": "BA",
                "flightNumber": "111",
                "serviceClass": "C",
                "origin": "LAX",
                "destination": "DFW",
                "departureTime": "2021-04-20T06:20:00.00Z",
                "arrivalTime": "2021-04-20T12:20:00.00Z"
            }),
            AirSegment.from_dict({
                "iataCode": "BA",
                "flightNumber": "444",
                "serviceClass": "C",
                "origin": "DFW",
                "destination": "LHR",
                "departureTime": "2021-04-20T20:00:00.00Z",
                "arrivalTime": "2021-04-21T12:20:00.00Z"
            })
        ]
        self.assertEqual("LAX", AmexReconciliationFields._determine_itinerary_destination(connecting_rt))
