import {
    convertSeatOptions,
    convertToSeatSelection, processSeatAvailabilityRS
} from '../../../../../../src/providers/americanairlines/converters/seatavailability';
import {NDCSeatSelection} from '../../../../../../src/interfaces/ndc';
import {loadSampleFile} from '../../testUtils';
import {NDCSeatAvailabilityResponse} from '../../../../../../src/interfaces/ndc';

describe('SeatOptionHelper', () => {
    describe('#convertSeatOptions', () => {
        it('should correctly convert seat selection to NDCOfferItem', async (done) => {
            const soapResponse = await loadSampleFile('SeatAvailabilityRS_DFWHOU_2ADT_RoundTrip.xml');
            const seatAvailabilityRS: NDCSeatAvailabilityResponse = await processSeatAvailabilityRS(soapResponse);

            let ndcOfferItem = convertSeatOptions('pax1', '9C', 'S1', seatAvailabilityRS.SeatAvailabilityRS);
            expect(ndcOfferItem).not.toBeUndefined();
            expect(ndcOfferItem.OfferItemID).toEqual('W963DCE0F-D6FE-4B83-A482-1-8');
            expect(ndcOfferItem.PassengerRefs).toEqual('pax1');
            expect(ndcOfferItem.SeatSelection.Column).toEqual('C');

            ndcOfferItem = convertSeatOptions('pax2', '9C', 'S1', seatAvailabilityRS.SeatAvailabilityRS);
            expect(ndcOfferItem).not.toBeUndefined();
            expect(ndcOfferItem.OfferItemID).toEqual('W963DCE0F-D6FE-4B83-A482-1-20');
            expect(ndcOfferItem.PassengerRefs).toEqual('pax2');
            expect(ndcOfferItem.SeatSelection.Column).toEqual('C');

            done();
        });

        it('should throw error on incorrect input', async (done) => {
            const soapResponse = await loadSampleFile('SeatAvailabilityRS_DFWHOU_2ADT_RoundTrip.xml');
            const seatAvailabilityRS: NDCSeatAvailabilityResponse = await processSeatAvailabilityRS(soapResponse);

            // invalid passenger
            expect(() => convertSeatOptions('pax3', '9C', 'S1', seatAvailabilityRS.SeatAvailabilityRS)).toThrowError('Cannot find offer item for requested seat');

            // invalid seat
            expect(() => convertSeatOptions('pax1', '100C', 'S1', seatAvailabilityRS.SeatAvailabilityRS)).toThrowError('Cannot find seat row 100');

            // invalid segment
            expect(() => convertSeatOptions('pax1', '9C', 'S10', seatAvailabilityRS.SeatAvailabilityRS)).toThrowError('Cannot find seatmap for requested segment');

            // invalid arguments
            expect(() => convertSeatOptions(undefined, '9C', 'S10', seatAvailabilityRS.SeatAvailabilityRS)).toThrowError('Cannot find seatmap for requested segment');
            expect(() => convertSeatOptions('pax1', undefined, 'S10', seatAvailabilityRS.SeatAvailabilityRS)).toThrowError('Invalid seat number');
            expect(() => convertSeatOptions('pax1', '9C', undefined, seatAvailabilityRS.SeatAvailabilityRS)).toThrowError('Cannot find seatmap for requested segment');

            done();
        });
    });

    describe('#convertToSeatSelection', () => {
        it('should correctly split seat number to column & row separately', () => {

            expect(() => convertToSeatSelection('A')).toThrowError('Invalid seat number');
            expect(() => convertToSeatSelection('A3')).toThrowError('Invalid seat number');
            expect(() => convertToSeatSelection('3')).toThrowError('Invalid seat number');
            expect(() => convertToSeatSelection('')).toThrowError('Invalid seat number');
            expect(() => convertToSeatSelection(undefined)).toThrowError('Invalid seat number');

            let actual: NDCSeatSelection = convertToSeatSelection('28A');
            expect(actual.Column).toEqual('A');
            expect(actual.Row).toEqual('28');
            actual = convertToSeatSelection('3B');
            expect(actual.Column).toEqual('B');
            expect(actual.Row).toEqual('3');
        });

    });
});
