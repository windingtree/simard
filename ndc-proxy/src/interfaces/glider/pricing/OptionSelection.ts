import {IsArray,  IsOptional, IsString, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {ExtendedPriceDetails} from '../common';
import {TaxItem} from './TaxItem';
import {OptionSelectionCriteria} from './OptionSelectionCriteria';

export class OptionSelection extends OptionSelectionCriteria {

    @IsOptional()
    @IsString()
    public name: string;

    @IsOptional()
    @IsString()
    public description: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ExtendedPriceDetails)
    public price: ExtendedPriceDetails;

    @IsOptional()
    @ValidateNested()
    @Type(() => TaxItem)
    @IsArray()
    public taxes: TaxItem[];

}
