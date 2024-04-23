import {SearchResults, Segment} from '../../../src/interfaces/glider';
import {keys} from '../validators';
import {OfferDetails} from './OfferDetails';
import {deconstructOfferDetails} from './deconstructOfferDetails';

export abstract class OfferPredicate {
    public abstract validateOffer(offer: OfferDetails): boolean;

    protected getAllSegments(offer: OfferDetails): Segment[] {
        const segments: Segment[] = [];
        // get flat list of segments
        offer.itineraries.forEach(itinerary => {
            itinerary.segments.forEach(segment => segments.push(segment));
        });
        return segments;
    }
}

/*
export class AtLeastOneSegmentOperatedBy extends OfferPredicate {
    constructor(private operatingCarrier: string) {
        super();
    }

    public validateOffer(offer: OfferDetails): boolean {
        const segments = super.getAllSegments(offer);
        let result = false;
        segments.forEach(segment => {
            if (segment.operator.iataCode === this.operatingCarrier) {
                result = true;
            }
        });
        return result;
    }
}

export class AtLeastOneSegmentNotOperatedBy extends OfferPredicate {
    constructor(private operatingCarrier: string) {
        super();
    }

    public validateOffer(offer: OfferDetails): boolean {
        const segments = super.getAllSegments(offer);
        let result = false;
        segments.forEach(segment => {
            if (segment.operator.iataCode !== this.operatingCarrier) {
                result = true;
            }
        });
        return result;
    }
}

export class AllSegmentsOperatedBy extends OfferPredicate {
    constructor(private operatingCarrier: string) {
        super();
    }

    public validateOffer(offer: OfferDetails): boolean {
        const segments = super.getAllSegments(offer);
        let result = true;
        segments.forEach(segment => {
            if (segment.operator.iataCode !== this.operatingCarrier) {
                result = false;
            }
        });
        return result;
    }
}

export class NoneOfSegmentsOperatedBy extends OfferPredicate {
    constructor(private operatingCarrier: string) {
        super();
    }

    public validateOffer(offer: OfferDetails): boolean {
        const segments = super.getAllSegments(offer);
        let result = true;
        segments.forEach(segment => {
            if (segment.operator.iataCode === this.operatingCarrier) {
                result = false;
            }
        });
        return result;
    }
}
*/

export class CodeshareFlight extends OfferPredicate {

    public validateOffer(offer: OfferDetails): boolean {
        const segments = super.getAllSegments(offer);
        let result = false;
        segments.forEach(segment => {
            // tslint:disable-next-line:radix
            if (segment.operator.iataCodeM && segment.operator.iataCodeM.length > 0) {
                result =  true;
            }
        });
        return result;
    }
}

export abstract class OfferComparator {
    public abstract compare(offerA: OfferDetails, offerB: OfferDetails): number;
}

export class OfferByDescendingPriceComparator extends OfferComparator {
    public compare(offerA: OfferDetails, offerB: OfferDetails): number {
        const diff = offerA.offer.price.public - offerB.offer.price.public;
        if (diff < 0) {
            return -1;
        }
        if (diff < 0) {
            return 1;
        }
        return 0;
    }
}

export class OfferByAscendingPriceComparator extends OfferByDescendingPriceComparator {
    public compare(offerA: OfferDetails, offerB: OfferDetails): number {
        return super.compare(offerB, offerA);
    }
}

export function offerSelector(searchResults: SearchResults, offerPredicates: OfferPredicate[], comparator: OfferComparator): string {
    const offerDetailsList: OfferDetails[] = [];
    keys(searchResults.offers).forEach(offerID => {
        offerDetailsList.push(deconstructOfferDetails(searchResults, offerID));
    });
    const filteredOfferDetails = offerDetailsList.filter(offerDetails => {
        let filterResult = true;
        offerPredicates.forEach(offerPreficate => {
            if (!offerPreficate.validateOffer(offerDetails)) {
                filterResult = false;
            }
        });
        return filterResult;
    });
    if (comparator) {
        filteredOfferDetails.sort(comparator.compare);
    }

    if (filteredOfferDetails.length > 0) {
        const offer = filteredOfferDetails[0];
        console.error('Selected offer:', offer.offerId, ' Itineraries:', offer.itineraries);
        return filteredOfferDetails[0].offerId;
    }
    console.error('No suitable offer was found!');
    return undefined;
}
