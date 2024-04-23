import {Type} from 'class-transformer';
import {NDCPieceAllowance} from './NDCPieceAllowance';
import {NDCBaggageCategory} from './NDCBaggageCategory';
import {NDCBaggageDeterminingCarrier} from './NDCBaggageDeterminingCarrier';

export class NDCBaggageAllowanceListItem {
    public BaggageAllowanceID: string;

    public BaggageCategory: NDCBaggageCategory;

    @Type(() => NDCPieceAllowance)
    public PieceAllowance: NDCPieceAllowance;

    @Type(() => NDCPieceAllowance)
    public BaggageDeterminingCarrier: NDCBaggageDeterminingCarrier;
}
