import {NDCPrice} from './NDCPrice';
import {Type} from 'class-transformer';

export class NDCTax  {
    @Type(() => NDCPrice)
    public Amount: NDCPrice;

    public Nation?: string;
    public TaxCode?: string;
    public Description?: string;
}
