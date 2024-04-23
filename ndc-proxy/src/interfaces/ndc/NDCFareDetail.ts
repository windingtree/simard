import {Type} from 'class-transformer';
import {NDCFareDetailPrice} from './NDCFareDetailPrice';
import {NDCFareBasis} from './NDCFareBasis';
import {NDCFareRules} from './NDCFareRules';

export class NDCFareDetail {
    public PassengerRefs: string;

    @Type(() => NDCFareDetailPrice)
    public Price: NDCFareDetailPrice;

    @Type(() => NDCFareBasis)
    public FareBasis: NDCFareBasis;

    @Type(() => NDCFareRules)
    public FareRules: NDCFareRules;

    public Remarks: string[];
}
