import {IsNotEmpty, IsNumber, IsOptional, IsString} from 'class-validator';

export class TaxItem {
    @IsNotEmpty()
    @IsNumber()
    public amount: number;

    @IsNotEmpty()
    @IsString()
    public currency: string;

    @IsNotEmpty()
    @IsString()
    public code: string;

    @IsString()
    @IsOptional()
    public description: string;

    constructor(amount?: number, currency?: string, code?: string, description?: string) {
        this.amount = amount;
        this.currency = currency;
        this.code = code;
        this.description = description;
    }
}
