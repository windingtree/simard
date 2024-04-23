import {Type} from 'class-transformer';

export class NDCTicketDocument {
    public TicketDocNbr: string;
    public Type: string;

    @Type(() => Number)
    public NumberofBooklets: number;

    public DateOfIssue: string;
    public ReportingType: string;
}
