import {Type} from 'class-transformer';
import {NDCSoapHeader} from './NDCSoapHeader';
import {NDCOfferPriceRS} from './NDCOfferPriceRS';

export class NDCOfferPriceResponse {
    @Type(() => NDCSoapHeader)
    public Header: NDCSoapHeader;

    @Type(() => NDCOfferPriceRS)
    public OfferPriceRS: NDCOfferPriceRS;
}
