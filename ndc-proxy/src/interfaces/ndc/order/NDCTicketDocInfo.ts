import {NDCTicketDocument} from './NDCTicketDocument';
import {Type} from 'class-transformer';

export class NDCTicketDocInfo {
    public IssuingAirlineInfoAirline: string;

    @Type(() => NDCTicketDocument)
    public TicketDocument: NDCTicketDocument;
}
