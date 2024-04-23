import {UnitType} from './UnitType';
import {IsEnum, IsNumber, ValidateNested} from 'class-validator';

export class RoomSize  {
    @ValidateNested()
    @IsEnum(UnitType)
    public unit: UnitType;

    @IsNumber()
    public value: number;
}
