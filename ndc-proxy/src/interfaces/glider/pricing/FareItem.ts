import {IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {FareItemType} from './FareItemType';
import {FareComponent} from './FareComponent';

export class FareItem {

    @IsNotEmpty()
    @IsEnum(FareItemType)
    public usage: FareItemType;

    @IsNotEmpty()
    @IsNumber()
    public amount: number;

    @IsOptional()
    @IsString()
    public description: string;

    @IsOptional()
    @Type(() => FareComponent)
    @ValidateNested()
    @IsArray()
    public components: FareComponent[];

    constructor(usage?: FareItemType, amount?: number, description?: string, components?: FareComponent[]) {
        this.usage = usage;
        this.amount = amount;
        this.components = components;
        this.description = description;
    }
}
