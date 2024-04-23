import {IsDate, IsNotEmpty, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {ExtendedPriceDetails} from './ExtendedPriceDetails';
import { PricePlanReference} from './SearchResults';

export interface OfferConstructorParameters {
    expiration: Date;
    price: ExtendedPriceDetails;
    pricePlansReferences?: Map<string, PricePlanReference>;
    provider: string;
}

export class Offer {
    @IsNotEmpty()
    @IsDate()
    public expiration: Date;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => ExtendedPriceDetails)
    public price: ExtendedPriceDetails;

    @ValidateNested({each: true})
    @Type(() => PricePlanReference)
    public pricePlansReferences: Map<string, PricePlanReference>;

    @IsNotEmpty()
    public provider: string;

    constructor({expiration, price, pricePlansReferences, provider}: OfferConstructorParameters) {
        this.expiration = expiration;
        this.price = price;
        this.pricePlansReferences = pricePlansReferences ? pricePlansReferences : new Map<string, PricePlanReference>();
        this.provider = provider;
    }
}
