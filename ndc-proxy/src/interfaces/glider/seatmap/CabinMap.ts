import {IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {Seat} from './Seat';

export class CabinMap {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsString()
    @IsNotEmpty()
    public layout: string;

    @IsNumber()
    @IsNotEmpty()
    public firstRow: number;

    @IsNumber()
    @IsNotEmpty()
    public lastRow: number;

    @IsNumber()
    @IsNotEmpty()
    public wingFirst: number;

    @IsNumber()
    @IsNotEmpty()
    public wingLast: number;

    @IsArray()
    @IsNotEmpty()
    public exitRows: number[];

    @IsArray()
    @Type(() => Seat)
    @ValidateNested()
    public seats: Seat[];

    @IsArray()
    @IsNotEmpty()
    public aisleColumns: string[];
}
