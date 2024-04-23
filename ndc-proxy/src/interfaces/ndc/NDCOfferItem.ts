import {Type} from 'class-transformer';
import {NDCPrice} from './NDCPrice';
import {NDCService} from './NDCService';
import {NDCFareDetail} from './NDCFareDetail';
import {NDCSeatSelection} from './order';

export class NDCOfferItem {
    public OfferItemID: string;

    @Type(() => Boolean)
    public MandatoryInd: boolean;

    @Type(() => NDCPrice)
    public TotalPriceDetail: NDCPrice;

    @Type(() => NDCService)
    public Service: NDCService;

    @Type(() => NDCFareDetail)
    public FareDetail: NDCFareDetail;

    public PassengerRefs: string;

    @Type(() => NDCSeatSelection)
    public SeatSelection: NDCSeatSelection;
}
