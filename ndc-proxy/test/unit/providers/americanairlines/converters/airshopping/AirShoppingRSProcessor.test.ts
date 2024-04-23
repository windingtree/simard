import {assertProperty, loadSampleFile} from '../../testUtils';
// import fs from 'fs';
import {
    NDCAirShoppingResponse, NDCAirShoppingRS, NDCFlightPriceClassRef,
     NDCOffer,
    NDCPrice,
    NDCSoapHeader, NDCTransactionInfo
} from '../../../../../../src/interfaces/ndc';
import {processAirShoppingRS} from '../../../../../../src/providers/americanairlines/converters/airshopping';
import {NDCCurrencyMetadata} from '../../../../../../src/interfaces/ndc';


describe('AirShoppingRSProcessor', () => {
    it('should transform AirShoppingRS from JSON to NDC object', async (done) => {
        const soapResponse = await loadSampleFile('AirShoppingRS_JFKDFW_1ADT_1CNN_OneWay.xml');
        const transformedResp = await processAirShoppingRS(soapResponse);

        expect(transformedResp).toBeInstanceOf(NDCAirShoppingResponse);
        assertProperty(transformedResp.Header, undefined, NDCSoapHeader);
        assertProperty(transformedResp.Header.Transaction, undefined, NDCTransactionInfo);
        assertProperty(transformedResp.Header.Transaction.dt, '2021-05-03T06:35:43');
        assertProperty(transformedResp.Header.Transaction.tid, '4271011D-80AFF5D0');
        assertProperty(transformedResp.Header.Transaction.pid, 'FLX DMServer TC1 (8800/3070) STG 0a19');

        assertProperty(transformedResp.AirShoppingRS, undefined, NDCAirShoppingRS);
        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0], undefined, NDCOffer);

        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].OfferID, 'X42CB7189-C2B9-42D6-B03B-1');
        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].ValidatingCarrier, 'AA');

        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].BaggageAllowance[0].BaggageAllowanceRef, 'Xbga0a002c28fd1fe');
        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].BaggageAllowance[0].FlightRefs, 'Iflt02002c28fd1fe');
        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].BaggageAllowance[0].PassengerRefs, 'T1 T2 T3');

        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].FlightsOverview[0], undefined, NDCFlightPriceClassRef);
        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].FlightsOverview[0].FlightRef, 'Iflt02002c28fd1fe');
        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].FlightsOverview[0].PriceClassRef, 'Xpc06002c28fd1fe');

        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].TimeLimits.OfferExpiration, new Date('2021-05-03T11:05:42Z'), Date);
        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].TimeLimits.Payment, new Date('2021-05-04T23:59:00'), Date);
        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].TimeLimits.TicketByTimeLimit, new Date('2021-05-04T23:59:00'), Date);

        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].TotalPrice, undefined, NDCPrice);
        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].TotalPrice.Code, 'USD');
        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].TotalPrice.Total, 40920);

        assertProperty(transformedResp.AirShoppingRS.AirlineOffers[0].Owner, 'AAD');

        expect(transformedResp.AirShoppingRS.Metadata.CurrencyMetadata).toHaveLength(1);

        assertProperty(transformedResp.AirShoppingRS.Metadata.CurrencyMetadata[0], undefined, NDCCurrencyMetadata);
        assertProperty(transformedResp.AirShoppingRS.Metadata.CurrencyMetadata[0].Application, 'Display');
        assertProperty(transformedResp.AirShoppingRS.Metadata.CurrencyMetadata[0].MetadataKey, 'USD');
        assertProperty(transformedResp.AirShoppingRS.Metadata.CurrencyMetadata[0].Decimals, 2);
        // fs.writeFileSync(`${__dirname}test.json`, JSON.stringify(transformedResp, undefined, 2));

        done();
    });

});
