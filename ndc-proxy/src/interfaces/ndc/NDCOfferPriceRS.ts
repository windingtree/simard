import {Type} from 'class-transformer';
import {NDCResponseId} from './NDCResponseId';
import {NDCOffer} from './NDCOffer';
import {NDCBaseResponse} from './common';

export class NDCOfferPriceRS extends NDCBaseResponse {

    @Type(() => NDCResponseId)
    public ShoppingResponseID?: NDCResponseId;

    @Type(() => NDCOffer)
    public PricedOffer: NDCOffer[];

}
