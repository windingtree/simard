import {Civility} from './Civility';
import {Gender} from './Gender';
import {PassengerType} from './PassengerType';
import {IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested} from 'class-validator';
import {Exclude, Type} from 'class-transformer';
import {FrequentFlyerAccount} from './FrequentFlyerAccount';

export class Passenger {
    @IsString()
    @IsOptional()
    @Exclude()
    public id: string;

    @Type(() => Date)
    @IsOptional()
    public birthdate: Date;

    @IsEnum(Civility)
    @IsOptional()
    public civility: Civility;

    @IsArray()
    @IsOptional()
    public contactInformation: string[];

    @IsNumber()
    @IsOptional()
    public count: number;

    @IsArray()
    @IsOptional()
    public firstnames: string[];

    @IsEnum(Gender)
    @IsOptional()
    public gender: Gender;

    @IsArray()
    @IsOptional()
    public lastnames: string[];

    @IsArray()
    @IsOptional()
    public middlenames: string[];

    @IsNotEmpty()
    @IsEnum(PassengerType)
    public type: PassengerType;

    @Type(() => FrequentFlyerAccount)
    @IsOptional()
    @ValidateNested({each: true})
    public loyaltyPrograms?: FrequentFlyerAccount[];

    @IsOptional()
    public infantReference: string;
}
