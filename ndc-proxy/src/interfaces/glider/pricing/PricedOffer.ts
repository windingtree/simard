import {
    IsArray,
    IsDate,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested
} from 'class-validator';
import {Type} from 'class-transformer';
import {ExtendedPriceDetails, Price} from '../common';
import {Passenger} from '../common';
import {OptionSelection} from './OptionSelection';
import {PricedItem} from './PricedItem';
import {Itinerary} from '../air';

export interface PricedOfferConstructorParameters {
    expiration: Date;
    price: ExtendedPriceDetails;
    pricedItems: PricedItem[];
    terms?: string;
    disclosures?: string[];
    passengers: Map<string, Passenger>;
    itinerary: Itinerary;
    options?: OptionSelection[];
}

export class PricedOffer {

    @IsNotEmpty()
    @IsDate()
    public expiration: Date;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Price)
    public price: ExtendedPriceDetails;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => PricedItem)
    @IsArray()
    public pricedItems: PricedItem[];

    @IsOptional()
    @IsString()
    public terms: string;

    @IsOptional()
    @IsArray()
    public disclosures: string[];

    @IsNotEmpty()
    @ValidateNested({each: true})
    @Type(() => Passenger)
    public passengers: Map<string, Passenger>;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Itinerary)
    public itinerary: Itinerary;

    @IsOptional()
    @ValidateNested()
    @Type(() => OptionSelection)
    @IsArray()
    public options: OptionSelection[];

    constructor(params?: PricedOfferConstructorParameters) {
        if (params) {
            const {expiration, price, pricedItems, terms, disclosures, passengers, itinerary, options} = params;
            this.expiration = expiration;
            this.price = price;
            this.pricedItems = pricedItems;
            this.terms = terms;
            this.disclosures = disclosures;
            this.passengers = passengers;
            this.itinerary = itinerary;
            this.options = options;
        }
    }
}
