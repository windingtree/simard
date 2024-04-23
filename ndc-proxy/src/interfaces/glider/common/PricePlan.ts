import {IsArray, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested} from 'class-validator';
import {BaggageAllowance} from '../air';
import {Type} from 'class-transformer';
import {Penalties} from './Penalties';

export interface PricePlanConstructorParameters {
    amenities?: string[];
    checkedBaggages: BaggageAllowance;
    description?: string;
    name: string;
    penalties: Penalties;
}

export class PricePlan {
    @IsArray()
    public amenities: string[];

    @IsObject()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => BaggageAllowance)
    public checkedBaggages: BaggageAllowance;

    @IsString()
    @IsOptional()
    public description?: string;

    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    @Type(() => Penalties)
    public penalties: Penalties;

    constructor({amenities, checkedBaggages, description, name, penalties}: PricePlanConstructorParameters) {
        this.amenities = amenities ? amenities : [];
        this.checkedBaggages = checkedBaggages;
        this.description = description;
        this.name = name;
        this.penalties = penalties;
    }
}
