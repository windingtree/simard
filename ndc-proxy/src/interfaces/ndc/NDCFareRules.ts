import {Type} from 'class-transformer';
import {NDCPenalties} from './NDCPenalties';

export class NDCFareRules {
    @Type(() => NDCPenalties)
    public Penalty: NDCPenalties;

    public PriceClassRef: string;
    public SegmentRefs: string;
}
