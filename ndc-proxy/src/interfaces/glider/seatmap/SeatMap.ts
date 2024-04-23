import {IsArray, IsNotEmpty, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {CabinMap} from './CabinMap';
import {ExtendedPriceDetails} from '../common';

export class SeatMap {
    @IsArray()
    @Type(() => CabinMap)
    @ValidateNested()
    @IsNotEmpty()
    public cabins: CabinMap[];

    @Type(() => ExtendedPriceDetails)
    @ValidateNested()
    @IsNotEmpty()
    public prices: Map<string, ExtendedPriceDetails>;

    @ValidateNested()
    @IsNotEmpty()
    public descriptions: Map<string, string[]>;
}
