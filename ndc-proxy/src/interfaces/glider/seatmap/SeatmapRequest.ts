import {ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {Passenger} from '../common';

export class SeatmapRequest  {
    @ValidateNested({ each: true })
    @Type(() => Passenger)
    public passengers: Map<string, Passenger>;
}
