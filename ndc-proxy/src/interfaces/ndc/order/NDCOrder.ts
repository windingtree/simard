import {NDCPrice} from '../NDCPrice';
import {NDCBookingReference} from './NDCBookingReference';
import {Type} from 'class-transformer';
import {NDCOrderItem} from './NDCOrderItem';

export class NDCOrder {
    public OrderID: string;
    public Owner: string;

    @Type(() => NDCBookingReference)
    public BookingReferences: NDCBookingReference[];

    @Type(() => NDCPrice)
    public TotalOrderPrice: NDCPrice;

    @Type(() => NDCOrderItem)
    public OrderItems: NDCOrderItem[];
}
