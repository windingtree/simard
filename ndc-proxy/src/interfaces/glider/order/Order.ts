import {ExtendedPriceDetails, Passenger} from '../common';
import {IsArray, IsEnum, IsNotEmpty, IsOptional} from 'class-validator';
import {Type} from 'class-transformer';
import {ServiceRestrictions} from './ServiceRestrictions';
import {OrderStatus} from './OrderStatus';
import {TravelDocuments} from './TravelDocuments';
import {OptionSelection} from '../pricing';
import {ItinerarySummary} from './ItinerarySummary';

export interface OrderConstructorParameters {
    price: ExtendedPriceDetails;
    restrictions: ServiceRestrictions;
    passengers: Passenger[];
    itinerary?: ItinerarySummary;
    options?: OptionSelection[];
    status: OrderStatus;
    travelDocuments: TravelDocuments;
}

export class Order {
    @IsNotEmpty()
    @Type(() => ExtendedPriceDetails)
    public price: ExtendedPriceDetails;

    @IsNotEmpty()
    @Type(() => ServiceRestrictions)
    public restrictions: ServiceRestrictions;

    @IsNotEmpty()
    @Type(() => Passenger)
    @IsArray()
    public passengers: Passenger[];

    @IsOptional()
    @Type(() => ItinerarySummary)
    public itinerary: ItinerarySummary;

    @IsOptional()
    @Type(() => OptionSelection)
    public options: OptionSelection[];

    @IsNotEmpty()
    @IsEnum(OrderStatus)
    public status: OrderStatus;

    @IsNotEmpty()
    @Type(() => TravelDocuments)
    public travelDocuments: TravelDocuments;

    constructor(params?: OrderConstructorParameters) {
        if (params) {
            const {price, restrictions, passengers, itinerary, options, status, travelDocuments} = params;
            this.price = price;
            this.restrictions = restrictions;
            this.passengers = passengers;
            this.itinerary = itinerary;
            this.options = options;
            this.status = status;
            this.travelDocuments = travelDocuments;
        }
    }
}
