import {Type} from 'class-transformer';
import {NDCPriceDetail} from './NDCPriceDetail';

export class NDCOrderItem {
    public OrderItemID: string;

    @Type(() => NDCPriceDetail)
    public PriceDetail: NDCPriceDetail;
}
