import {loadSampleFile} from './testUtils';
import {NDCOrderViewRS} from '../../../../src/interfaces/ndc';
import {OrderCreateResultsBuilder} from '../../../../src/providers/americanairlines/OrderCreateResultsBuilder';
import {CreateOrderResponse} from '../../../../src/interfaces/glider';
import {processOrderCreateRS} from '../../../../src/providers/americanairlines/converters/ordercreate';
import * as fs from 'fs';
import {env} from '../../../../src/env';

describe('OrderCreateResultsBuilder', () => {
    it('should convert NDCOrderCreate response to Glider create order results', async () => {
        const soapResponse = await loadSampleFile('OrderCreateRS_DFWHOU_2ADT_RoundTrip.xml');
        const orderViewRS: NDCOrderViewRS = (await processOrderCreateRS(soapResponse)).OrderViewRS;
        // fs.writeFileSync(`${__dirname}OrderCreateRS_DFWHOU_2ADT_RoundTrip.json`, JSON.stringify(transformedResp, undefined, 2));
        const builder = new OrderCreateResultsBuilder(env.AA_BUSINESS, orderViewRS);
        const res: CreateOrderResponse = builder.build(undefined);
        expect(res).not.toBeUndefined();
        fs.writeFileSync(`${__dirname}OrderCreateRS_DFWHOU_2ADT_RoundTrip_response.json`, JSON.stringify(res, undefined, 2));
        // expect(res.passengers.size).toEqual(transformedResp.OfferPriceRS.PricedOffer[0].ValidatingCarrier);
    });
});
