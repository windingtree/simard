import {assertProperty, loadSampleFile} from '../../testUtils';
import {
    NDCFareBasis, NDCFareDetailPrice, NDCFareRules, NDCFlightPriceClassRef,
    NDCOfferPriceResponse,
    NDCPenalties, NDCPrice, NDCService, NDCSoapHeader, NDCTransactionInfo
} from '../../../../../../src/interfaces/ndc';
import {processOfferPriceRS} from '../../../../../../src/providers/americanairlines/converters/offerprice';

describe('OfferPriceRSProcessor.ts', () => {
    it('should transform OfferPriceRS from JSON to NDC object', async (done) => {
        const soapResponse = await loadSampleFile('OfferPriceRS_JFKDFW_2ADT_1CNN_RoundTrip.xml');
        const transformedResp = await processOfferPriceRS(soapResponse);
        // fs.writeFileSync(`${__dirname}OfferPriceRS_JFKDFW_2ADT_1CNN_RoundTrip.json`, JSON.stringify(transformedResp, undefined, 2));
        expect(transformedResp).toBeInstanceOf(NDCOfferPriceResponse);
        assertProperty(transformedResp.Header, undefined, NDCSoapHeader);
        assertProperty(transformedResp.Header.Transaction, undefined, NDCTransactionInfo);
        assertProperty(transformedResp.Header.Transaction.dt, '2021-05-08T06:35:38');
        assertProperty(transformedResp.Header.Transaction.tid, '0275F25B-3796F7C0');
        assertProperty(transformedResp.Header.Transaction.pid, 'FLX DMServer TC1 (8800/3070) STG 0a7c');

        assertProperty(transformedResp.OfferPriceRS.TransactionIdentifier, '8e85e9ab1ed946d4a1a21d14380fc4e5');
        assertProperty(transformedResp.OfferPriceRS.ShoppingResponseID.ResponseID, 'PDF5736F-F112-4804-A1BA');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].ResponseID, 'PDF5736F-F112-4804-A1BA');

        expect(transformedResp.OfferPriceRS.Warnings).toHaveLength(1);
        expect(transformedResp.OfferPriceRS.Warnings[0]).toEqual('NOT FARED AT PASSENGER TYPE REQUESTED');
        expect(transformedResp.OfferPriceRS.PricedOffer).toHaveLength(1);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].ValidatingCarrier, 'AA');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].TotalPrice, undefined, NDCPrice);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].BaggageAllowance[0].BaggageAllowanceRef, 'PcoIDBARXAARQVIZJHMM0BAQ50ZGXPNI1J3KTHM4C2HPZRZLIDUPCDBCB');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].BaggageAllowance[0].FlightRefs, 'FGTIDVGRPVOTYVDBBBECPZ3MMAA21VGUBYL1CK52STXH3DCGCJGGQ5OUO');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].BaggageAllowance[0].PassengerRefs, 'pax1 pax2 pax3');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].FlightsOverview[0], undefined, NDCFlightPriceClassRef);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].FlightsOverview[0].FlightRef, 'FGTIDVGRPVOTYVDBBBECPZ3MMAA21VGUBYL1CK52STXH3DCGCJGGQ5OUO');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].FlightsOverview[0].PriceClassRef, 'MainCabin');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].TimeLimits.OfferExpiration, new Date('2021-05-08T11:05:36Z'), Date);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].TimeLimits.Payment, new Date('2021-05-09T23:59:00'), Date);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].TimeLimits.TicketByTimeLimit, new Date('2021-05-09T23:59:00'), Date);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].TotalPrice, undefined, NDCPrice);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].TotalPrice.Code, 'USD');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].TotalPrice.Total, 123540);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].Owner, 'AAD');

        expect(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems).toHaveLength(2);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].OfferItemID, 'PoIPDF5736F-F112-4804-A1BA-1-1');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].TotalPriceDetail, undefined, NDCPrice);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].TotalPriceDetail.Total, 82360);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].TotalPriceDetail.Code, 'USD');

        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].Service, undefined, NDCService);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].Service.ServiceID, 'PsvFltPDF5736F-F112-4804-A1BA-1-1');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].Service.PassengerRefs, 'pax1 pax2');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].Service.FlightRefs, 'FGTIDVGRPVOTYVDBBBECPZ3MMAA21VGUBYL1CK52STXH3DCGCJGGQ5OUO FGTID02TA3C2Z1BZ5J1YE0PCONV4AVOSH5PYH4Z5G10JM3NSNEOEQEXWK');

        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price, undefined, NDCFareDetailPrice);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.BaseAmount, undefined, NDCPrice);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.BaseAmount.Total, 35628);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.BaseAmount.Code, 'USD');

        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.Taxes.Total.Total, 5552);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.Taxes.Total.Code, 'USD');

        expect(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.Taxes.Breakdown).toHaveLength(4);

        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.Taxes.Breakdown[0].Amount, undefined, NDCPrice);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.Taxes.Breakdown[0].Amount.Total, 2672);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.Taxes.Breakdown[0].Amount.Code, 'USD');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.Taxes.Breakdown[0].Nation, 'US');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.Taxes.Breakdown[0].TaxCode, 'US');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.Price.Taxes.Breakdown[0].Description, 'U.S.A Transportation Tax');

        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareBasis, undefined, NDCFareBasis);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareBasis.RBD, 'M');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareBasis.CabinTypeCode, 'Y');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareBasis.CabinTypeName, 'COACH');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareBasis.FareBasisCode, 'M8AIZNN1');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareBasis.FareBasisCityPair, 'JFKDFWAA');

        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareRules, undefined, NDCFareRules);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareRules.Penalty, undefined, NDCPenalties);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareRules.Penalty.CancelFeeInd, false);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareRules.Penalty.ChangeFeeInd, false);
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareRules.Penalty.RefundableInd, false);

        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareRules.PriceClassRef, 'MainCabin');
        assertProperty(transformedResp.OfferPriceRS.PricedOffer[0].OfferItems[0].FareDetail.FareRules.SegmentRefs, 'Isgm01003a6966962');
        done();
    });
    it('should retrieve error&warnings from response', async (done) => {
        const soapResponse = await loadSampleFile('OfferPriceRS_Error_ExpiredOffer.xml');
        const transformedResp = await processOfferPriceRS(soapResponse);
        expect(transformedResp).toBeInstanceOf(NDCOfferPriceResponse);
        expect(transformedResp.OfferPriceRS.Errors).toBeInstanceOf(Array);
        expect(transformedResp.OfferPriceRS.Errors.length).toEqual(1);
        expect(transformedResp.OfferPriceRS.Errors[0].Type).toEqual('DME');
        expect(transformedResp.OfferPriceRS.Errors[0].ShortText).toEqual('230000002');
        expect(transformedResp.OfferPriceRS.Errors[0].Code).toEqual('325');
        expect(transformedResp.OfferPriceRS.Errors[0].Owner).toEqual('');
        expect(transformedResp.OfferPriceRS.Errors[0].Message).toEqual('Invalid or Expired Offer X9EBA9B90-5D95-4080-8817-1');
        done();
    });
});
