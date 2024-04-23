import {Type} from 'class-transformer';
import {NDCALaCarteOfferItem} from './NDCALaCarteOfferItem';

export class NDCALaCarteOffer {
    public OfferID: string;
    public Owner: string;
    public ResponseID: string;

    @Type(() => NDCALaCarteOfferItem)
    public ALaCarteOfferItems: NDCALaCarteOfferItem[];
}
