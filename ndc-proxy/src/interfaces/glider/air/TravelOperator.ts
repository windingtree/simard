import {TravelOperatorType} from './TravelOperatorType';
import {IsEnum, IsNotEmpty, IsString} from 'class-validator';

export class TravelOperator {
    @IsNotEmpty()
    @IsString()
    public flightNumber: string;

    @IsNotEmpty()
    @IsString()
    public iataCode: string;

    @IsNotEmpty()
    @IsString()
    public iataCodeM: string;

    @IsNotEmpty()
    @IsEnum(TravelOperatorType)
    public operatorType: TravelOperatorType;
}
