import {Type} from 'class-transformer';
import {NDCPrice} from './NDCPrice';
import {NDCTaxes} from './NDCTaxes';

export class NDCFareDetailPrice {
    @Type(() => NDCPrice)
    public BaseAmount: NDCPrice;

    @Type(() => NDCPrice)
    public Surcharges: NDCPrice;

    @Type(() => NDCTaxes)
    public Taxes: NDCTaxes;
}
