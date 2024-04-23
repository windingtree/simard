import {Type} from 'class-transformer';
import {NDCSeat} from './NDCSeat';

export class NDCCabinRow {
    @Type(() => Number)
    public Number: number;

    public Seats: NDCSeat[];
}
