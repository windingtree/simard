import {IsDate, IsNotEmpty, IsOptional, ValidateNested} from 'class-validator';
import {LocationIATA} from '../accommodation';
import {TravelOperator} from './TravelOperator';
import {Transform, Type} from 'class-transformer';
import moment from 'moment';

function customConverter(value: any, key: any, obj: SegmentCriteria, type: any): Date {
    // console.log(`customConverter(${value},${key},${obj},${type})`);
    if (value.length === 9) {
        obj.isLocalDepartureTimeRequested = true;
    }
    const m = moment(value);
    return m.toDate();
}

export class SegmentCriteria {
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    public arrivalTime?: Date;

    // @IsDate()
    @Type(() => String)
    @Transform( ({ value, key, obj, type }) => customConverter( value, key, obj, type ))
    public departureTime: Date;

    public isLocalDepartureTimeRequested: boolean;

    @Type(() => Date)
    // @Transform( ({ value, key, obj, type }) => customConverter( value, key, obj, type ))
    public departureTimeStr: string;

    @ValidateNested()
    @IsNotEmpty()
    @Type(() => LocationIATA)
    public destination: LocationIATA;

    @ValidateNested()
    @Type(() => TravelOperator)
    @IsOptional()
    public operator?: TravelOperator;

    @ValidateNested()
    @IsNotEmpty()
    @Type(() => LocationIATA)
    public origin: LocationIATA;

}
