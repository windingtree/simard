import {Type} from 'class-transformer';
import {NDCAirShoppingRS} from './NDCAirShoppingRS';
import {NDCSoapHeader} from './NDCSoapHeader';

export class NDCAirShoppingResponse {
    @Type(() => NDCSoapHeader)
    public Header: NDCSoapHeader;

    @Type(() => NDCAirShoppingRS)
    public AirShoppingRS: NDCAirShoppingRS;
}
