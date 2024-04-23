import {NDCCabinRow, NDCSeat, NDCSeatAvailabilityRS, NDCSeatMap} from '../../../../interfaces/ndc';
import {NDCSeatSelection} from '../../../../interfaces/ndc';
import {SeatOfferItemWithPrice} from './SeatOfferItemWithPrice';

/**
 * Convert seat selection from Glider format to NDCOfferItem (which is required to create an order)
 * @param passengerRef Passenger reference (e.g. 'pax1')
 * @param seatNumber Seat number in Glider format (e.g. '9A')
 * @param segmentRef Segment reference (string, e.g. 'S1')
 * @param seatAvailabilityRS Previous seatAvailability response (from NDC)
 */
export function convertSeatOptions(passengerRef: string, seatNumber: string, segmentRef: string, seatAvailabilityRS: NDCSeatAvailabilityRS): SeatOfferItemWithPrice {
        const seatSelection: NDCSeatSelection = convertToSeatSelection(seatNumber); // convert 10A into 10 (row) and A(column)
        // find offer item for requested seat, segment and passenger
        // first find seatmap for requested segment
        const seatMap: NDCSeatMap = seatAvailabilityRS.SeatMaps.find(sm => sm.SegmentRef === segmentRef);
        if (!seatMap) {
            throw new Error(`Cannot find seatmap for requested segment`);
        }
        // now find row
        const seatRow: NDCCabinRow = seatMap.cabins[0].Rows.find(row => String(row.Number) === seatSelection.Row);
        if (!seatRow) {
            throw new Error(`Cannot find seat row ${seatSelection.Row}`);
        }
        const seat: NDCSeat = seatRow.Seats.find(s => s.Column === seatSelection.Column);
        if (!seat) {
            throw new Error(`Cannot find seat column ${seatSelection.Column}`);
        }
        // we found a seat that was requested but this seat may have multiple offerItemRefs assigned (in case search was for more than 1 pax)
        // so now we need to check each offerItem (SeatAvailabilityRS/ALaCarteOffer/ALaCarteOfferItem) and find the one that is eligible for requested passenger
        let requestedSeatOfferItem: SeatOfferItemWithPrice = undefined;
        seat.OfferItemRefs.split(' ').forEach(offerItemRef => {
            const offerItem = seatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems.find(oi => oi.OfferItemID === offerItemRef);
            if (offerItem.Eligibility.PassengerRefs === passengerRef && offerItem.Eligibility.SegmentRefs === segmentRef) {
                // bingo - we found offer item that is for requested passenger (and segment)
                // create OfferItem that will be used in CreateOrderRQ
                requestedSeatOfferItem = new SeatOfferItemWithPrice();
                requestedSeatOfferItem.OfferItemID = offerItem.OfferItemID;
                requestedSeatOfferItem.PassengerRefs = passengerRef;
                requestedSeatOfferItem.SeatSelection = seatSelection;
                requestedSeatOfferItem.UnitPriceDetail = offerItem.UnitPriceDetail;
            }
        });
        if (!requestedSeatOfferItem) {
            throw new Error(`Cannot find offer item for requested seat ${seatNumber}`);
        }
        return requestedSeatOfferItem;
}

/**
 * Parse seat number from Glider format to NDC format
 * @param seatNumber Seat number (e.g. '10C')
 */
export function convertToSeatSelection(seatNumber: string = ''): NDCSeatSelection {
    const regexp = new RegExp('([0-9]{1,})([A-Z]{1,})');    // expression to match Glider seat number format e.g. 25A or 5B
    if (!seatNumber.match(regexp)) {
        throw new Error(`Invalid seat number ${seatNumber}`);
    }
    const split = seatNumber.split(regexp);

    const result = new NDCSeatSelection();
    result.Column = split[2];
    result.Row = split[1];
    return result;
}
