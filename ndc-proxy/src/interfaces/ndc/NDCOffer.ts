import {Type} from 'class-transformer';
import {NDCFlightPriceClassRef} from './NDCFlightPriceClassRef';
import {NDCPrice} from './NDCPrice';
import {NDCOfferItem} from './NDCOfferItem';
import {NDCBaggageAllowance} from './NDCBaggageAllowance';
import {NDCOfferTimelimits} from './NDCOfferTimelimits';

export class NDCOffer {
    public OfferID: string;
    public Owner: string;
    public ResponseID: string;
    public ValidatingCarrier?: string;

    @Type(() => NDCOfferTimelimits)
    public TimeLimits: NDCOfferTimelimits;

    @Type(() => NDCPrice)
    public TotalPrice: NDCPrice;

    @Type(() => NDCFlightPriceClassRef)
    public FlightsOverview: NDCFlightPriceClassRef[];

    @Type(() => NDCOfferItem)
    public OfferItems: NDCOfferItem[];

    @Type(() => NDCBaggageAllowance)
    public BaggageAllowance: NDCBaggageAllowance[];

}
