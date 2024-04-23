import {IsNotEmpty, IsUUID, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {PricedOffer} from './PricedOffer';

export class PricedOfferResponse {
    @IsNotEmpty()
    @IsUUID()
    public offerId: string;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => PricedOffer)
    public offer: PricedOffer;

    constructor(offerId?: string, offer?: PricedOffer) {
        this.offerId = offerId;
        this.offer = offer;
    }
}
