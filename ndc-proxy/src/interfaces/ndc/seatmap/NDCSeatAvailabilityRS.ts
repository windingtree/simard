import {NDCBaseResponse} from '../common';
import {Type} from 'class-transformer';
import {NDCResponseId} from '../NDCResponseId';
import {NDCALaCarteOffer} from './NDCALaCarteOffer';
import {NDCSeatMap} from './NDCSeatMap';

export class NDCSeatAvailabilityRS extends NDCBaseResponse {
    @Type(() => NDCResponseId)
    public ShoppingResponseID?: NDCResponseId;

    @Type(() => NDCALaCarteOffer)
    public ALaCarteOffer: NDCALaCarteOffer;

    @Type(() => NDCSeatMap)
    public SeatMaps: NDCSeatMap[];
}
