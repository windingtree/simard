import {loadSampleFile} from './testUtils';
import {NDCOfferPriceRS} from '../../../../src/interfaces/ndc';
import {processOfferPriceRS} from '../../../../src/providers/americanairlines/converters/offerprice';
import {OfferPriceResultsBuilder} from '../../../../src/providers/americanairlines/OfferPriceResultsBuilder';
import {PricedOfferResponse} from '../../../../src/interfaces/glider';

describe('OfferPriceResultsBuilder', () => {
    it('should convert NDC offer price response to Glider offer price results', async (done) => {
        const soapResponse = await loadSampleFile('OfferPriceRS_JFKDFW_2ADT_1CNN_RoundTrip.xml');
        const offerPriceRS: NDCOfferPriceRS = (await processOfferPriceRS(soapResponse)).OfferPriceRS;

        const builder = new OfferPriceResultsBuilder(offerPriceRS);
        const res: PricedOfferResponse[] = builder.build();
        expect(res).not.toBeUndefined();
        // expect(res.passengers.size).toEqual(transformedResp.OfferPriceRS.PricedOffer[0].ValidatingCarrier);
        done();
    });
});
