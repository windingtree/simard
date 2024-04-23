import {IsNotEmpty, IsNumber} from 'class-validator';
import {Price} from './Price';

export class ExtendedPriceDetails extends Price {
    @IsNumber()
    @IsNotEmpty()
    public commission: number;

    @IsNumber()
    @IsNotEmpty()
    public taxes: number;

    constructor(amount?: number, currencyCode?: string, commission?: number, taxes?: number) {
        super(amount, currencyCode);
        this.commission = commission;
        this.taxes = taxes;
    }
}
