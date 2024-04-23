export type ComponentType = 'air' | 'hotel';
export type DocumentType = 'TKT' | 'EMD';

export interface SMDTravelComponentAirSegment {
    iataCode: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    serviceClass?: string;
}

interface SMDTravelComponentTaxes {
    amount: string;
    iataCode: string;
    taxId: string;
    countryCode: string;
}

interface SMDTravelComponentAmounts {
    total: string;
    base: string;
    taxes?: SMDTravelComponentTaxes[];
}
export interface SMDTravelComponentAir {
    componentType: ComponentType;
    recordLocator: string;
    documentType: DocumentType;
    documentNumber: string;
    documentIssuanceDate: string;
    segments: SMDTravelComponentAirSegment[];
    amounts: SMDTravelComponentAmounts;

    contactEmail: string;
}
export interface SMDTravelComponentHotelRoomRate {
    dayRateAmount: string;
    nightCount: number;
}

export interface SMDTravelComponentHotel {
    componentType: ComponentType;
    folioNumber: string;
    checkInDate: string;
    checkOutDate: string;
    roomRates: SMDTravelComponentHotelRoomRate[];
}

export type SMDTravelComponentPayloadItem = SMDTravelComponentHotel |  SMDTravelComponentAir;
export type SMDTravelComponentPayload = SMDTravelComponentPayloadItem[];
