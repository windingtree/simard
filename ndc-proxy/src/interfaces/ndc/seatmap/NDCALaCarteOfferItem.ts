import {Type} from 'class-transformer';
import {NDCPriceDetail} from '../order';
import {NDCService} from '../NDCService';
import {NDCEligibility} from './NDCEligibility';

export class NDCALaCarteOfferItem {
    public OfferItemID: string;

    @Type(() => NDCEligibility)
    public Eligibility: NDCEligibility;

    @Type(() => NDCPriceDetail)
    public UnitPriceDetail: NDCPriceDetail;

    @Type(() => NDCService)
    public Service: NDCService;
}
