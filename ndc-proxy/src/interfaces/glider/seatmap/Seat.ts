import {IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString} from 'class-validator';
import { SeatMetadata } from '../common/SeatMetadata';

export class Seat {
    @IsNumber()
    @IsNotEmpty()
    public number: string;

    @IsNumber()
    @IsNotEmpty()
    public row: number;

    @IsString()
    @IsNotEmpty()
    public column: string;

    @IsBoolean()
    @IsNotEmpty()
    public available: boolean;

    @IsArray()
    @IsNotEmpty()
    public characteristics: string[];

    @IsString()
    @IsNotEmpty()
    public optionCode: string;

    public seatMetadata: SeatMetadata;
}
