import {Type} from 'class-transformer';
import {NDCCabinLayoutColumn} from './NDCCabinLayoutColumn';

export class NDCCabinLayout {
    @Type(() => NDCCabinLayoutColumn)
    public Columns: NDCCabinLayoutColumn[];

    @Type(() => Number)
    public RowFirst: number;

    @Type(() => Number)
    public RowLast: number;
}
