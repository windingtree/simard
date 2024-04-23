import {assertProperty, loadSampleFile} from '../../testUtils';
import {processSeatAvailabilityRS} from '../../../../../../src/providers/americanairlines/converters/seatavailability';
import {
    NDCALaCarteOffer, NDCCabin, NDCCabinLayout, NDCCabinRow, NDCEligibility,
    NDCSeatAvailabilityResponse,
    NDCSeatAvailabilityRS, NDCSeatMap
} from '../../../../../../src/interfaces/ndc';
import {NDCPrice, NDCService, NDCSoapHeader, NDCTransactionInfo} from '../../../../../../src/interfaces/ndc';
// import fs from 'fs';

describe('SeatAvailabilityRSProcessor', () => {
    it('should transform SeatAvailabilityRS from JSON to NDC Objects', async (done) => {
        const soapResponse = await loadSampleFile('SeatAvailabilityRS_DFWHOU_2ADT_RoundTrip.xml');
        const transformedResp: NDCSeatAvailabilityResponse = await processSeatAvailabilityRS(soapResponse);
        expect(transformedResp).toBeInstanceOf(NDCSeatAvailabilityResponse);
        assertProperty(transformedResp.Header, undefined, NDCSoapHeader);
        assertProperty(transformedResp.Header.Transaction, undefined, NDCTransactionInfo);
        assertProperty(transformedResp.Header.Transaction.dt, '2021-05-24T12:38:09');
        assertProperty(transformedResp.Header.Transaction.tid, '562670E3-8576F0E0');
        assertProperty(transformedResp.Header.Transaction.pid, 'FLX DMServer TC1 (8800/3070) STG 0a7c');

        assertProperty(transformedResp.SeatAvailabilityRS, undefined, NDCSeatAvailabilityRS);
        assertProperty(transformedResp.SeatAvailabilityRS.TransactionIdentifier, '7cf41e2bbc41438983e3787e33ce3333');
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer, undefined, NDCALaCarteOffer);
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.OfferID, 'W963DCE0F-D6FE-4B83-A482-1');
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.Owner, 'AAD');
        expect(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems).toHaveLength(48);
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].OfferItemID, 'W963DCE0F-D6FE-4B83-A482-1-1');
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].Eligibility, undefined, NDCEligibility);
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].Eligibility.PassengerRefs, 'pax1');
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].Eligibility.SegmentRefs, 'S1');
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].UnitPriceDetail.TotalAmount, undefined, NDCPrice);
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].UnitPriceDetail.TotalAmount.Total, 0);
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].UnitPriceDetail.TotalAmount.Code, 'USD');
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].UnitPriceDetail.BaseAmount, undefined, NDCPrice);
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].UnitPriceDetail.BaseAmount.Total, 0);
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].UnitPriceDetail.BaseAmount.Code, 'USD');
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].UnitPriceDetail.Taxes, undefined, NDCPrice);
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].UnitPriceDetail.Taxes.Total, 0);
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].UnitPriceDetail.Taxes.Code, 'USD');
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].Service, undefined, NDCService);
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].Service.ServiceID, 'W963DCE0F-D6FE-4B83-A482-1-1-1');
        assertProperty(transformedResp.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems[0].Service.ServiceDefinitionRef, 'DS7cf41e2bbc41438983e3787e33ce33330');

        expect(transformedResp.SeatAvailabilityRS.SeatMaps).toHaveLength(2);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0], undefined, NDCSeatMap);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].SegmentRef, 'S1');

        expect(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins).toHaveLength(1);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0], undefined, NDCCabin);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].CabinLayout, undefined, NDCCabinLayout);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].CabinLayout.Columns, ['A', 'B', 'C', 'D', 'E', 'F']);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].CabinLayout.RowFirst, 8);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].CabinLayout.RowLast, 33);

        expect(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].Rows).toHaveLength(26);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].Rows[0], undefined, NDCCabinRow);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].Rows[0].Number, 8);
        expect(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].Rows[0].Seats).toHaveLength(6);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].Rows[0].Seats[0].SeatStatus, 'A');
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].Rows[0].Seats[0].SeatCharacteristics, ['K', 'L']);
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].Rows[0].Seats[0].Column, 'A');
        assertProperty(transformedResp.SeatAvailabilityRS.SeatMaps[0].cabins[0].Rows[0].Seats[0].OfferItemRefs, 'W963DCE0F-D6FE-4B83-A482-1-18 W963DCE0F-D6FE-4B83-A482-1-6');

        done();
    });

});
