import {IsCurrency, IsNotEmpty, IsNumber} from 'class-validator';

export class Price {
    @IsCurrency()
    @IsNotEmpty()
    public currency: string;

    @IsNumber()
    @IsNotEmpty()
    public public: number;

    /**
     * Overloaded (kinda) constructor. Allowed versions: a) no params b) both params provided
     * @param amount
     * @param currencyCode
     */
    constructor(amount?: number, currencyCode?: string) {
        if (amount && !currencyCode) {
            throw new Error('Cannot specify price without currency code');
        }
        if (amount === undefined && currencyCode) {
            throw new Error('Cannot specify price without amount');
        }
        if (amount < 0) {
            throw new Error('Price amount cannot be negative');
        }
        this.currency = currencyCode;
        this.public = amount;
    }
}
