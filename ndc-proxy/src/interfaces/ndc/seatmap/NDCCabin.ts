import {Type} from 'class-transformer';
import {NDCCabinRow} from './NDCCabinRow';
import {NDCCabinLayout} from './NDCCabinLayout';

export class NDCCabin {
    public CabinTypeCode: string;
    @Type(() => NDCCabinLayout)
    public CabinLayout: NDCCabinLayout;

    @Type(() => NDCCabinRow)
    public Rows: NDCCabinRow[];
}
