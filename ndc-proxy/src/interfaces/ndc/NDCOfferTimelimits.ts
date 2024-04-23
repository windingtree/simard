import {Type} from 'class-transformer';

export class NDCOfferTimelimits {

    @Type(() => Date)
    public OfferExpiration?: Date;

    @Type(() => Date)
    public Payment?: Date;

    @Type(() => Date)
    public TicketByTimeLimit?: Date;

}
