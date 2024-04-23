import {LocationIATA} from '../accommodation/Location';
import {TravelOperator} from './TravelOperator';
import {IsDate, IsNotEmpty, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import { Equipment } from './Equipment';

export class Segment {
    @IsNotEmpty()
    @IsDate()
    public arrivalTime: Date;

    @IsNotEmpty()
    @IsDate()
    public departureTime: Date;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => LocationIATA)
    public destination: LocationIATA;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => TravelOperator)
    public operator: TravelOperator;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => LocationIATA)
    public origin: LocationIATA;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Equipment)
    public equipment: Equipment;
}
