import {Type} from 'class-transformer';
import {NDCTransactionInfo} from './NDCTransactionInfo';

export class NDCSoapHeader {
    @Type(() => NDCTransactionInfo)
    public Transaction: NDCTransactionInfo;
}
