import {Seat} from '../../../src/interfaces/glider';
import {ExtendedPriceDetails} from '../../../src/interfaces/glider';

export interface SeatDetails {
    seat: Seat;
    price: ExtendedPriceDetails;
}
