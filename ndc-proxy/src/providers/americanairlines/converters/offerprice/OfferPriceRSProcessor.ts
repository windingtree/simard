import camaro from 'camaro';
import {NDCOfferPriceResponse} from '../../../../interfaces/ndc';
import {PlainToNDCTransformer} from '../../PlainToNDCTransformer';
import {assertNoErrorInResponse} from '../utils/assertNDCResponseError';

const template = [
    '//OfferPriceRS',
    {
        Header: {
            Transaction: {
                pid: '//soapenv:Header/Transaction/tc/pid',
                tid: '//soapenv:Header/Transaction/tc/tid',
                dt: '//soapenv:Header/Transaction/tc/dt',
            },
        },
        OfferPriceRS: {
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
            PricedOffer: [
                'PricedOffer',
                {

                    OfferID: '@OfferID',
                    Owner: '@Owner',
                    ResponseID: '//OfferPriceRS/ShoppingResponseID/ResponseID',
                    ValidatingCarrier: 'ValidatingCarrier',
                    TimeLimits: {
                        OfferExpiration: 'TimeLimits/OfferExpiration/@DateTime',
                        Payment: 'TimeLimits/Payment/@DateTime',
                        TicketByTimeLimit: 'TimeLimits/OtherLimits/OtherLimit/TicketByTimeLimit/TicketBy',
                    },
                    TotalPrice: {
                        Total: 'TotalPrice/DetailCurrencyPrice/Total',
                        Code: 'TotalPrice/DetailCurrencyPrice/Total/@Code',
                    },
                    FlightsOverview: [
                        'FlightsOverview/FlightRef',
                        {
                            FlightRef: '.',
                            PriceClassRef: '@PriceClassRef',
                        },
                    ],
                    OfferItems: [
                        'OfferItem',
                        {
                            OfferItemID: '@OfferItemID',
                            TotalPriceDetail: {
                                Total: 'TotalPriceDetail/TotalAmount/DetailCurrencyPrice/Total',
                                Code: 'TotalPriceDetail/TotalAmount/DetailCurrencyPrice/Total/@Code',
                            },
                            Service: {
                                ServiceID: 'Service/@ServiceID',
                                PassengerRefs: 'Service/PassengerRefs',
                                FlightRefs: 'Service/FlightRefs',
                            },
                            FareDetail: {
                                PassengerRefs: 'FareDetail/PassengerRefs',
                                Price: {
                                    BaseAmount: {
                                        Total: 'FareDetail/Price/BaseAmount',
                                        Code: 'FareDetail/Price/BaseAmount/@Code',
                                    },
                                    Surcharges: {
                                        Total: 'FareDetail/Price/Surcharges/Surcharge/Total',
                                        Code: 'FareDetail/Price/Surcharges/Surcharge/Total/@Code',
                                    },
                                    Taxes: {
                                        Total: {
                                            Total: 'FareDetail/Price/Taxes/Total',
                                            Code: 'FareDetail/Price/Taxes/Total/@Code',
                                        },
                                        Breakdown: [
                                            'FareDetail/Price/Taxes/Breakdown/Tax',
                                            {
                                                Amount: {
                                                    Total: 'Amount',
                                                    Code: 'Amount/@Code',
                                                },
                                                Code: 'Amount/@Code',
                                                Nation: 'Nation',
                                                TaxCode: 'TaxCode',
                                                Description: 'Description',
                                            },
                                        ],
                                    },
                                },
                                FareBasis: {
                                    FareBasisCode: 'FareDetail/FareComponent/FareBasis/FareBasisCode/Code',
                                    FareBasisCityPair: 'FareDetail/FareComponent/FareBasis/FareBasisCityPair',
                                    RBD: 'FareDetail/FareComponent/FareBasis/RBD',
                                    CabinTypeCode: 'FareDetail/FareComponent/FareBasis/CabinType/CabinTypeCode',
                                    CabinTypeName: 'FareDetail/FareComponent/FareBasis/CabinType/CabinTypeName',
                                },
                                FareRules: {
                                    Penalty: {
                                        CancelFeeInd: 'FareDetail/FareComponent/FareRules/Penalty/@CancelFeeInd',
                                        ChangeFeeInd: 'FareDetail/FareComponent/FareRules/Penalty/@ChangeFeeInd',
                                        RefundableInd: 'FareDetail/FareComponent/FareRules/Penalty/@RefundableInd',
                                    },
                                    PriceClassRef: 'FareDetail/FareComponent/PriceClassRef',
                                    SegmentRefs: 'FareDetail/FareComponent/SegmentRefs',
                                },
                                Remarks: [
                                    'FareDetail/Remarks',
                                    'Remark',
                                ],
                            },
                        },
                    ],
                    BaggageAllowance: [
                        'BaggageAllowance',
                        {
                            FlightRefs: 'FlightRefs',
                            PassengerRefs: 'PassengerRefs',
                            BaggageAllowanceRef: 'BaggageAllowanceRef',
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

export async function processOfferPriceRS(soapResponse: string): Promise<NDCOfferPriceResponse> {
    const results = await camaro.transform(soapResponse, template);
    const ndcOfferPriceResponse = PlainToNDCTransformer.transformOfferPriceRS(results[0]);
    assertNoErrorInResponse(ndcOfferPriceResponse.OfferPriceRS);    // check response errors and throw error if there are problems detected
    return ndcOfferPriceResponse;
}
