import { IsNotEmpty, IsNumber} from 'class-validator';

export class BaggageAllowance  {
    @IsNotEmpty()
    @IsNumber()
    public quantity: number;
/*
    @IsNotEmpty()
    @Transform(category=>BaggageCategory.CarryOn)
    type: BaggageCategory;*/

    constructor(quantity?: number) {
        this.quantity = quantity;
    }
}
