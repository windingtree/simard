import {Type} from 'class-transformer';
import {NDCSoapHeader} from '../NDCSoapHeader';
import {NDCOrderViewRS} from './NDCOrderViewRS';

export class NDCBaseOrderResponse {
    @Type(() => NDCSoapHeader)
    public Header: NDCSoapHeader;

    @Type(() => NDCOrderViewRS)
    public OrderViewRS: NDCOrderViewRS;
}
