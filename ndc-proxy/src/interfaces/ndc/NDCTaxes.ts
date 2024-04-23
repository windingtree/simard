import {Type} from 'class-transformer';
import {NDCPrice} from './NDCPrice';
import {NDCTax} from './NDCTax';

export class NDCTaxes {
    @Type(() => NDCPrice)
    public Total: NDCPrice;

    @Type(() => NDCTax)
    public Breakdown: NDCTax[];

}
