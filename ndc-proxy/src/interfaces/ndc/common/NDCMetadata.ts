import {Type} from 'class-transformer';
import {NDCCurrencyMetadata} from './NDCCurrencyMetadata';

export class NDCMetadata {
    @Type(() => NDCCurrencyMetadata)
    public CurrencyMetadata: NDCCurrencyMetadata[];
}
