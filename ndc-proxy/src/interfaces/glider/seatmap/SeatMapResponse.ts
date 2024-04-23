import {IsNotEmpty, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {SeatMap} from './SeatMap';
import {ExtendedPriceDetails} from '../common';

export class SeatMapResponse {
    @Type(() => SeatMap)
    @ValidateNested()
    @IsNotEmpty()
    public seatmaps: Map<string, SeatMap>;

    @Type(() => ExtendedPriceDetails)
    @ValidateNested()
    @IsNotEmpty()
    public prices: Map<string, ExtendedPriceDetails>;
}
