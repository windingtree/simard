import {loadSampleFile} from './testUtils';
import {processSeatAvailabilityRS} from '../../../../src/providers/americanairlines/converters/seatavailability';
import {SeatMapResponse} from '../../../../src/interfaces/glider';
import {SeatMapResponseBuilder} from '../../../../src/providers/americanairlines/SeatMapResponseBuilder';
import {processOfferPriceRS} from '../../../../src/providers/americanairlines/converters/offerprice';

describe('SeatMapResponseBuilder', () => {
    it('should convert NDC seat availability response to Glider format', async (done) => {
        const seatAvailRS = (await processSeatAvailabilityRS(await loadSampleFile('SeatAvailabilityRS_DFWHOU_2ADT_RoundTrip.xml'))).SeatAvailabilityRS;
        const offerPriceRS = (await processOfferPriceRS(await loadSampleFile('OfferPriceRS_JFKDFW_2ADT_1CNN_RoundTrip.xml'))).OfferPriceRS;

        const builder = new SeatMapResponseBuilder(seatAvailRS, offerPriceRS);
        const res: SeatMapResponse = builder.build();
        expect(res).not.toBeUndefined();
        done();
    });
});
