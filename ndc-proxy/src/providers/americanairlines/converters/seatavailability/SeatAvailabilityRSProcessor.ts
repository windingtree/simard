import camaro from 'camaro';
import {NDCSeatAvailabilityResponse} from '../../../../interfaces/ndc';
import {PlainToNDCTransformer} from '../../PlainToNDCTransformer';
import {assertNoErrorInResponse} from '../utils/assertNDCResponseError';
// import {NDCOfferPriceResponse} from '../../../../interfaces/ndc';

const template = [
    '//SeatAvailabilityRS',
    {
        Header: {
            Transaction: {
                pid: '//soapenv:Header/Transaction/tc/pid',
                tid: '//soapenv:Header/Transaction/tc/tid',
                dt: '//soapenv:Header/Transaction/tc/dt',
            },
        },
        SeatAvailabilityRS: {
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
            ShoppingResponseID: {
                ResponseID: 'ShoppingResponseID/ResponseID',
                owner: 'ShoppingResponseID/Owner',
            },
            TransactionIdentifier: '@TransactionIdentifier',
            ALaCarteOffer: {
                OfferID: '//SeatAvailabilityRS/ALaCarteOffer/@OfferID',
                Owner: '//SeatAvailabilityRS/ALaCarteOffer/@Owner',
                ResponseID: 'ShoppingResponseID/ResponseID',
                ALaCarteOfferItems: [
                    '//SeatAvailabilityRS/ALaCarteOffer/ALaCarteOfferItem',
                    {
                        OfferItemID: '@OfferItemID',
                        Eligibility: {
                            PassengerRefs: 'Eligibility/PassengerRefs',
                            SegmentRefs: 'Eligibility/SegmentRefs',
                        },
                        UnitPriceDetail: {
                            TotalAmount: {
                                Total: 'UnitPriceDetail/TotalAmount/DetailCurrencyPrice/Total',
                                Code: 'UnitPriceDetail/TotalAmount/DetailCurrencyPrice/Total/@Code',
                            },
                            BaseAmount: {
                                Total: 'UnitPriceDetail/BaseAmount',
                                Code: 'UnitPriceDetail/BaseAmount/@Code',
                            },
                            Taxes: {
                                Total: 'UnitPriceDetail/Taxes/Total',
                                Code: 'UnitPriceDetail/Taxes/Total/@Code',
                            },
                        },
                        Service: {
                            ServiceDefinitionRef: 'Service/ServiceDefinitionRef',
                            ServiceID: 'Service/@ServiceID',
                        },
                    },
                ],
            },
            SeatMaps: [
                '//SeatAvailabilityRS/SeatMap',
                {
                    SegmentRef: 'SegmentRef',
                    cabins: [
                        'Cabin',
                        {
                            CabinTypeCode: 'CabinType/Code',
                            CabinLayout: {
                                Columns: [
                                    'CabinLayout/Columns',
                                    {
                                        Position: '@Position',
                                        Value: '.',
                                    },
                                ],
                                RowFirst: 'CabinLayout/Rows/First',
                                RowLast: 'CabinLayout/Rows/Last',
                            } ,
                            Rows: [
                                'Row',
                                {
                                    Number: 'Number',
                                    Seats: [
                                        'Seat',
                                        {
                                            Column: 'Column',
                                            SeatStatus: 'SeatStatus',
                                            SeatCharacteristics: [
                                                'SeatCharacteristics/Code',
                                                '.',
                                            ],
                                            OfferItemRefs: 'OfferItemRefs',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
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
            ServiceDefinitions: [
                '//DataLists/ServiceDefinitionList/ServiceDefinition',
                {
                    ServiceDefinitionID: '@ServiceDefinitionID',
                    Owner: '@Owner',
                    Name: 'Name',
                    Code: 'Code',
                    Descriptions: [
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

export async function processSeatAvailabilityRS(soapResponse: string): Promise<NDCSeatAvailabilityResponse> {
    const results = await camaro.transform(soapResponse, template);
    const ndcSeatAvailabilityResponse = PlainToNDCTransformer.transformSeatAvailRS(results[0]);
    assertNoErrorInResponse(ndcSeatAvailabilityResponse.SeatAvailabilityRS);    // check response errors and throw error if there are problems detected
    return ndcSeatAvailabilityResponse;
}
