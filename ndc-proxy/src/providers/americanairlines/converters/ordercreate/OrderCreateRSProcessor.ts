import camaro from 'camaro';
import {NDCOrderCreateResponse} from '../../../../interfaces/ndc';
import {PlainToNDCTransformer} from '../../PlainToNDCTransformer';
import {assertNoErrorInResponse} from '../utils/assertNDCResponseError';

const template = [
    '//OrderViewRS',
    {
        Header: {
            Transaction: {
                pid: '//soapenv:Header/Transaction/tc/pid',
                tid: '//soapenv:Header/Transaction/tc/tid',
                dt: '//soapenv:Header/Transaction/tc/dt',
            },
        },
        OrderViewRS: {
            Success: 'Success',
            Warnings: [
                'Warnings',
                'Warning',
            ],
            Errors: [
                'Errors',
                {
                    Type: 'Error/@Type',
                    ShortText: 'Error/@ShortText',
                    Code: 'Error/@Code',
                    Owner: 'Error/@Owner',
                    Message: 'Error',
                },
            ],
            TransactionIdentifier: '@TransactionIdentifier',
            Orders: [
                'Response/Order',
                {
                    OrderID: '@OrderID',
                    Owner: '@Owner',
                    BookingReferences: [
                        'BookingReferences/BookingReference',
                        {
                            ID: 'ID',
                            OtherId: 'OtherID',
                            AirlineID: 'AirlineID',
                            AirlineName: 'AirlineID/@Name',
                        },
                    ],
                    TotalOrderPrice: {
                        Total: 'TotalOrderPrice/DetailCurrencyPrice/Total',
                        Code: 'TotalOrderPrice/DetailCurrencyPrice/Total/@Code',
                    },
                    OrderItems: [
                        'OrderItems/OrderItem',
                        {
                            OrderItemID: '@OrderItemID',
                            PriceDetail: {
                                TotalAmount: {
                                    Total: 'PriceDetail/TotalAmount/DetailCurrencyPrice/Total',
                                    Code: 'PriceDetail/TotalAmount/DetailCurrencyPrice/Total/@Code',
                                },
                                BaseAmount: {
                                    Total: 'PriceDetail/BaseAmount',
                                    Code: 'PriceDetail/BaseAmount/@Code',
                                },
                                Taxes: {
                                    Total: 'PriceDetail/Taxes/Total',
                                    Code: 'PriceDetail/Taxes/Total/@Code',
                                },
                            },
                        },
                    ],
                },
            ],
            TicketDocInfos: [
                '//OrderViewRS/Response/TicketDocInfos/TicketDocInfo',
                {
                    IssuingAirlineInfoAirline: 'IssuingAirlineInfo/AirlineName',
                    TicketDocument: {
                        TicketDocNbr: 'TicketDocument/TicketDocNbr',
                        Type: 'TicketDocument/Type',
                        NumberofBooklets: 'TicketDocument/NumberofBooklets',
                        DateOfIssue: 'TicketDocument/DateOfIssue',
                        ReportingType: 'TicketDocument/ReportingType',
                    },
                },
            ],
            PassengerList: [
                '//DataLists/PassengerList/Passenger',
                {
                    PassengerID: '@PassengerID',
                    type: 'PTC',
                    GivenName: 'Individual/GivenName',
                    Surname: 'Individual/Surname',
                    Birthdate: 'Individual/Birthdate',
                    Gender: 'Individual/Gender',
                    LoyaltyPrograms: [
                        'LoyaltyProgramAccount',
                        {
                            number: 'AccountNumber',
                            airlineDesignator: 'Airline/AirlineDesignator',
                            programName: 'ProgramName',
                        },
                    ],
                    ContactInfoRef: 'ContactInfoRef',
                },
            ],
            ContactList: [
                '//DataLists/ContactList/ContactInformation',
                {
                    ContactID: '@ContactID',
                    Phones: [
                        'ContactProvided/Phone',
                        {
                            Label: 'Label',
                            PhoneNumber: 'PhoneNumber',
                        },
                    ],
                    EmailAddresses: [
                        'ContactProvided/EmailAddress',
                        {
                            EmailAddressValue: 'EmailAddressValue',
                        },
                    ],
                },
            ],
            BaggageAllowanceList: [
                '//DataLists/BaggageAllowanceList/BaggageAllowance',
                {
                    BaggageAllowanceID: '@BaggageAllowanceID',
                    BaggageCategory: 'BaggageCategory',
                    PieceAllowance: {
                        TotalQuantity: 'PieceAllowance/TotalQuantity',
                    },
                },
            ],
            FareList: [
                '//DataLists/FareList/FareGroup',
                {
                    refs: '@refs',
                    ListKey: '@ListKey',
                    FareCode: 'Fare/FareCode',
                    FareBasisCode: 'FareBasisCode/Code',
                },
            ],
            FlightSegmentList: [
                '//DataLists/FlightSegmentList/FlightSegment',
                {
                    SegmentKey: '@SegmentKey',
                    ConnectInd: '@ConnectInd',
                    ElectronicTicketInd: '@ElectronicTicketInd',
                    SecureFlight: '@SecureFlight',
                    Departure: {
                        locationType: '#airport',
                        AirportCode: 'Departure/AirportCode',
                        Date: 'Departure/Date',
                        Time: 'Departure/Time',
                        TerminalName: 'Departure/Terminal/Name',
                    },
                    Arrival: {
                        locationType: '#airport',
                        AirportCode: 'Arrival/AirportCode',
                        Date: 'Arrival/Date',
                        Time: 'Arrival/Time',
                        TerminalName: 'Arrival/Terminal/Name',
                    },
                    MarketingCarrier: {
                        AirlineID: 'MarketingCarrier/AirlineID',
                        Name: 'MarketingCarrier/Name',
                        FlightNumber: 'MarketingCarrier/FlightNumber',
                    },
                    OperatingCarrier: {
                        AirlineID: 'OperatingCarrier/AirlineID',
                        Name: 'OperatingCarrier/Name',
                        FlightNumber: 'OperatingCarrier/FlightNumber',
                    },
                    Equipment: {
                        AircraftCode: 'Equipment/AircraftCode',
                    },
                    ClassOfService: 'ClassOfService/Code',
                    FlightDetail: {
                        FlightDuration: {
                            Value: 'FlightDetail/FlightDuration/Value',
                        },
                        Stops: {
                            StopQuantity: 'FlightDetail/Stops/StopQuantity',
                        },
                    },
                },
            ],
            FlightList: [
                '//DataLists/FlightList/Flight',
                {
                    FlightKey: '@FlightKey',
                    SegmentReferences: 'SegmentReferences',
                },
            ],
            OriginDestinationList: [
                '//DataLists/OriginDestinationList/OriginDestination',
                {
                    OriginDestinationKey: '@OriginDestinationKey',
                    refs: '@refs',
                    FlightReferences: 'FlightReferences',
                },
            ],
            PriceClassList: [
                '//DataLists/PriceClassList/PriceClass',
                {
                    PriceClassID: '@PriceClassID',
                    Name: 'Name',
                    Code: 'Code',
                    Description: [
                        'Descriptions/Description',
                        'Text',
                    ],
                },
            ],
            Metadata: {
                CurrencyMetadata: [
                    '//Metadata/Other/OtherMetadata/CurrencyMetadatas/CurrencyMetadata',
                    {
                        MetadataKey: '@MetadataKey',
                        Application: 'Application',
                        Decimals: 'Decimals',
                    },
                ],
            },
        },
    },
];

export async function processOrderCreateRS(soapResponse: string): Promise<NDCOrderCreateResponse> {
    const results = await camaro.transform(soapResponse, template);
    const ndcOrderCreateResponse = PlainToNDCTransformer.transformOrderCreateRS(results[0]);
    assertNoErrorInResponse(ndcOrderCreateResponse.OrderViewRS);    // check response errors and throw error if there are problems detected
    return ndcOrderCreateResponse;
}
