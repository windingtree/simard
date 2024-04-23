import {loadSampleFile} from '../../testUtils';
import {processOfferPriceRS} from '../../../../../../src/providers/americanairlines/converters/offerprice';
import {assertNoErrorInResponse} from '../../../../../../src/providers/americanairlines/converters/utils/assertNDCResponseError';
import {processOrderCreateRS} from '../../../../../../src/providers/americanairlines/converters/ordercreate';

describe('assertNoErrorInResponse.ts', () => {
    it('should throw exception if there is error in NDC response', async (done) => {
        const response = await processOfferPriceRS(await loadSampleFile('OfferPriceRS_Error_ExpiredOffer.xml'));
        expect(() => assertNoErrorInResponse(response.OfferPriceRS)).toThrowError('325:Invalid or Expired Offer X9EBA9B90-5D95-4080-8817-1');
        done();
    });
    it('should not throw exception if response is OK', async (done) => {
        const response = await processOfferPriceRS(await loadSampleFile('OfferPriceRS_JFKDFW_1ADT.xml'));
        expect(assertNoErrorInResponse(response.OfferPriceRS)).toBeUndefined();
        done();
    });
    it('should not throw exception if there are warnings in response(but no errors)', async (done) => {
        const response = await processOrderCreateRS(await loadSampleFile('OrderCreateRS_successfull_booking_with_warnings.xml'));
        expect(assertNoErrorInResponse(response.OrderViewRS)).toBeUndefined();
        done();
    });
    it('should throw exception if response is empty/null/undefined', () => {
        expect(() => assertNoErrorInResponse(undefined)).toThrowError('No response from provider');
    });

});
