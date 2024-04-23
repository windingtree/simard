import {Offer} from '../../../src/interfaces/glider';
import {OfferItinerary} from './OfferItinerary';

export interface OfferDetails {
    offerId: string;
    offer: Offer;
    itineraries: OfferItinerary[];
}
