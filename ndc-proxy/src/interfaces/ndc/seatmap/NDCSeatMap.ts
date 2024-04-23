import {Type} from 'class-transformer';
import {NDCCabin} from './NDCCabin';

export class NDCSeatMap {
    public SegmentRef: string;

    @Type(() => NDCCabin)
    public cabins: NDCCabin[];
}
