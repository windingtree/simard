import {Type} from 'class-transformer';
import {NDCSoapHeader} from '../NDCSoapHeader';
import {NDCSeatAvailabilityRS} from './NDCSeatAvailabilityRS';

export class NDCSeatAvailabilityResponse {
    @Type(() => NDCSoapHeader)
    public Header: NDCSoapHeader;

    @Type(() => NDCSeatAvailabilityRS)
    public SeatAvailabilityRS: NDCSeatAvailabilityRS;
}
