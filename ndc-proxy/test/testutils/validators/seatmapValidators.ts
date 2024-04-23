/* tslint:disable:no-console */
import {ExtendedPriceDetails, SearchResults} from '../../../src/interfaces/glider';
import {CabinMap, Seat, SeatMap, SeatMapResponse} from '../../../src/interfaces/glider';
import {getMapValue, getSegmentIDsOfOffer, keys} from './utils';

export function validateSingleSeatPrice(optionPrice: ExtendedPriceDetails): void {
    try {
        // make sure prices are numeric
        expect(optionPrice).not.toBeUndefined();
        expect(optionPrice.taxes).toBeGreaterThan(-1);
        expect(optionPrice.commission).toBeGreaterThan(-1);
        expect(optionPrice.currency).toHaveLength(3);
        expect(optionPrice.public).toBeGreaterThan(-1);
    } catch (err: any) {
        console.log('optionPrice', optionPrice);
        throw err;
    }
}

export function validateSingleSeat(seat: Seat, seatMap: SeatMap): void {
    try {
        expect(seat.optionCode.length).toBeGreaterThan(0);
        expect(seat.available).not.toBeUndefined();
        expect(seat.number.length).toBeGreaterThan(0);
        expect(seat.characteristics).not.toBeUndefined();
        expect(seat.characteristics).toBeInstanceOf(Array);
        // expect(seat.characteristics.length).toBeGreaterThan(0);  //TODO - AA sometimes do not provide any seat characteristic
        expect(seat.column.length).toBeGreaterThan(0);
        expect(seat.row).toBeGreaterThan(0);
        // make sure option code exists (and has a price)
        const optionPrice: ExtendedPriceDetails = getMapValue<ExtendedPriceDetails>(seatMap.prices, seat.optionCode);
        validateSingleSeatPrice(optionPrice);
    } catch (err: any) {
        // tslint:disable-next-line:no-console
        console.debug('Invalid seat:', seat);
        throw err;
    }
}

export function validateSingleCabinMap(cabin: CabinMap, seatMap: SeatMap): void {
    expect(cabin.seats.length).toBeGreaterThan(0);
    // expect(cabin.exitRows.length).toBeGreaterThan(0);
    expect(cabin.name.length).toBeGreaterThan(0);
    expect(cabin.layout.length).toBeGreaterThan(0);
    // expect(cabin.wingLast).toBeGreaterThan(0);
    // expect(cabin.wingFirst).toBeGreaterThan(0);
    expect(cabin.firstRow).toBeGreaterThan(0);
    expect(cabin.lastRow).toBeGreaterThan(0);

    cabin.seats.forEach(seat => {
        validateSingleSeat(seat, seatMap);
    });
}

export function validateSingleSeatMap(seatMap: SeatMap): void {
    expect(seatMap.cabins.length).toBeGreaterThan(0);
    seatMap.cabins.forEach(cabin => {
        validateSingleCabinMap(cabin, seatMap);
    });
}

export function validateSeatMapResponse(seatmapResults: SeatMapResponse,  searchResults: SearchResults, offerIdFromSearch: string): void {
        // make sure segmentIs from search response are same as in seatmap response - identifiers have to match
        compareSegmentsFromSeatmapWithPricingResponse(seatmapResults, searchResults, offerIdFromSearch);
        // validate every seatmap
        keys(seatmapResults.seatmaps).forEach(segmentID => {
            const seatMap: SeatMap = getMapValue<SeatMap>(seatmapResults.seatmaps, segmentID);
            validateSingleSeatMap(seatMap);
        });
}

function compareSegmentsFromSeatmapWithPricingResponse(seatmapResults: SeatMapResponse, searchResults: SearchResults, offerIdFromSearch: string): void {
    const segmentIDsOfOffer = getSegmentIDsOfOffer(offerIdFromSearch, searchResults);
    const segmentIDsFromSeatmapResponse = keys(seatmapResults.seatmaps);
    try {
        // the following conditions should not be checked as sometimes we request seatmap for selected segments (not all), e.g. skip codeshares
        // expect(segmentIDsFromSeatmapResponse.length).toEqual(segmentIDsOfOffer.length);
        segmentIDsFromSeatmapResponse.forEach(segmentID => {
            expect(segmentIDsOfOffer).toContain(segmentID);
        });
    } catch (err: any) {
        // display diagnostic
        console.debug('segmentIDsOfOffer', segmentIDsOfOffer);
        console.debug('segmentIDsFromSeatmapResponse', segmentIDsFromSeatmapResponse);
        throw err;
    }
}
