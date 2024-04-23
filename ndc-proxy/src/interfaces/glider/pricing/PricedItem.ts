import {IsArray, IsOptional, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {TaxItem} from './TaxItem';
import {FareItem} from './FareItem';

export class PricedItem {
    @IsOptional()
    @ValidateNested({each: true})
    @Type(() => TaxItem)
    @IsArray()
    public taxes: TaxItem[];

    @IsOptional()
    @ValidateNested({each: true})
    @Type(() => FareItem)
    @IsArray()
    public fare: FareItem[];

    @IsOptional()
    @IsArray()
    public passengerRefs: string[];

    @IsOptional()
    @IsArray()
    public segmentRefs: string[];
}
