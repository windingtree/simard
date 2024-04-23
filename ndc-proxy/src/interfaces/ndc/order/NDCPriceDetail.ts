import {Type} from 'class-transformer';
import {NDCPrice} from '../NDCPrice';

export class NDCPriceDetail {
    @Type(() => NDCPrice)
    public TotalAmount: NDCPrice;

    @Type(() => NDCPrice)
    public BaseAmount: NDCPrice;

    @Type(() => NDCPrice)
    public Taxes: NDCPrice;

}
