import {IsEnum, IsNotEmpty, IsNumber, Max, Min} from 'class-validator';
import {PassengerType} from './PassengerType';
import {FrequentFlyerAccount} from './FrequentFlyerAccount';
import {Type} from 'class-transformer';

export class PassengerSearchCriteria {
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    @Max(9)
    public count: number;

    @IsNotEmpty()
    @IsEnum(PassengerType)
    public type: PassengerType;

    @Type(() => FrequentFlyerAccount)
    public loyaltyPrograms: FrequentFlyerAccount[];

    constructor(count?: number, type?: PassengerType) {
        this.count = count;
        this.type = type;
    }
}
