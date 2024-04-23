import {Type} from 'class-transformer';
import {NDCOfferItem} from '../../../../interfaces/ndc';
import {NDCPriceDetail} from '../../../../interfaces/ndc';

export class SeatOfferItemWithPrice extends NDCOfferItem {
    @Type(() => NDCPriceDetail)
    public UnitPriceDetail: NDCPriceDetail;
}
