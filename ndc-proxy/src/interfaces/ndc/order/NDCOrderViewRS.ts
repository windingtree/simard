import {Type} from 'class-transformer';
import {NDCBaseResponse} from '../common';
import {NDCOrder} from './NDCOrder';
import {NDCTicketDocInfo} from './NDCTicketDocInfo';

export class NDCOrderViewRS extends NDCBaseResponse {
    @Type(() => NDCOrder)
    public Orders: NDCOrder[];

    @Type(() => NDCTicketDocInfo)
    public TicketDocInfos: NDCTicketDocInfo[];
}
