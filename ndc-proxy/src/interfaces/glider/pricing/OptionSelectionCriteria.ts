import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class OptionSelectionCriteria {
    @IsString()
    @IsNotEmpty()
    public code: string;

    @IsOptional()
    @IsString()
    public passenger: string;

    @IsOptional()
    @IsString()
    public segment: string;

    @IsOptional()
    @IsString()
    public seatNumber: string;

    constructor(code?: string, passenger?: string, segment?: string, seatNumber?: string) {
        this.code = code;
        this.passenger = passenger;
        this.segment = segment;
        this.seatNumber = seatNumber;
    }
}
