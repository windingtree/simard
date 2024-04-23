import {NDCPaymentType} from './NDCPaymentType';
import {NDCPaymentCard} from './NDCPaymentCard';
import {Type} from 'class-transformer';

export class NDCPaymentDetails {

    public type: NDCPaymentType;

    @Type(() => NDCPaymentCard)
    public card?: NDCPaymentCard;
    public amount: string;
    public currencyCode: string;
}
