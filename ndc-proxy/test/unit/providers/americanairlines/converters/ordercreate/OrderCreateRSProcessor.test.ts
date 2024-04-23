import {assertProperty, loadSampleFile} from '../../testUtils';
import {
    NDCBookingReference,
    NDCOrder,
    NDCOrderCreateResponse,
    NDCOrderViewRS, NDCTicketDocInfo
} from '../../../../../../src/interfaces/ndc';
import {NDCPrice, NDCSoapHeader, NDCTransactionInfo} from '../../../../../../src/interfaces/ndc';
import {processOrderCreateRS} from '../../../../../../src/providers/americanairlines/converters/ordercreate';
import {NDCTicketDocument} from '../../../../../../src/interfaces/ndc';

describe('OrderCreateRSProcessor', () => {

    it('should transform OrderCreateRS from JSON to object', async (done) => {
        const soapResponse = await loadSampleFile('OrderCreateRS_DFWHOU_2ADT_RoundTrip.xml');
        const transformedResp: NDCOrderCreateResponse = await processOrderCreateRS(soapResponse);
        // fs.writeFileSync(`${__dirname}OrderCreateRS_DFWHOU_2ADT_RoundTrip.json`, JSON.stringify(transformedResp, undefined, 2));
        expect(transformedResp).toBeInstanceOf(NDCOrderCreateResponse);
        assertProperty(transformedResp.Header, undefined, NDCSoapHeader);
        assertProperty(transformedResp.Header.Transaction, undefined, NDCTransactionInfo);
        assertProperty(transformedResp.Header.Transaction.dt, '2021-05-30T04:48:28');
        assertProperty(transformedResp.Header.Transaction.tid, '073EBD7A-01CFF260');
        assertProperty(transformedResp.Header.Transaction.pid, 'FLX DMServer TC1 (8800/3070) STG 0a19');

        assertProperty(transformedResp.OrderViewRS, undefined, NDCOrderViewRS);
        assertProperty(transformedResp.OrderViewRS.TransactionIdentifier, 'fac51b74ae744e9fa1520cf2798ed04d');
        expect(transformedResp.OrderViewRS.Orders).toHaveLength(1);

        assertProperty(transformedResp.OrderViewRS.Orders[0], undefined, NDCOrder);
        assertProperty(transformedResp.OrderViewRS.Orders[0].OrderID, 'AA001EC1E2F02' );
        assertProperty(transformedResp.OrderViewRS.Orders[0].Owner, 'AAD');
        expect(transformedResp.OrderViewRS.Orders[0].BookingReferences).toHaveLength(2);

        assertProperty(transformedResp.OrderViewRS.Orders[0].BookingReferences[0], undefined, NDCBookingReference );
        assertProperty(transformedResp.OrderViewRS.Orders[0].BookingReferences[0].ID, 'NGZO3W');
        assertProperty(transformedResp.OrderViewRS.Orders[0].BookingReferences[0].OtherId, 'F1');
        assertProperty(transformedResp.OrderViewRS.Orders[0].BookingReferences[0].AirlineID, undefined);

        assertProperty(transformedResp.OrderViewRS.Orders[0].BookingReferences[1].ID, 'KXRSUF');
        assertProperty(transformedResp.OrderViewRS.Orders[0].BookingReferences[1].AirlineName, 'American Airline(Direct)');
        assertProperty(transformedResp.OrderViewRS.Orders[0].BookingReferences[1].AirlineID, 'AAD');
        assertProperty(transformedResp.OrderViewRS.Orders[0].BookingReferences[1].OtherId, undefined);

        assertProperty(transformedResp.OrderViewRS.Orders[0].TotalOrderPrice, undefined, NDCPrice);
        assertProperty(transformedResp.OrderViewRS.Orders[0].TotalOrderPrice.Total, 42560);
        assertProperty(transformedResp.OrderViewRS.Orders[0].TotalOrderPrice.Code, 'USD');

        expect(transformedResp.OrderViewRS.TicketDocInfos).toHaveLength(2);
        assertProperty(transformedResp.OrderViewRS.TicketDocInfos[0], undefined, NDCTicketDocInfo);
        assertProperty(transformedResp.OrderViewRS.TicketDocInfos[0].IssuingAirlineInfoAirline, 'AAD');
        assertProperty(transformedResp.OrderViewRS.TicketDocInfos[0].TicketDocument, undefined, NDCTicketDocument);
        assertProperty(transformedResp.OrderViewRS.TicketDocInfos[0].TicketDocument.DateOfIssue, '2021-05-30');
        assertProperty(transformedResp.OrderViewRS.TicketDocInfos[0].TicketDocument.NumberofBooklets, 1);
        assertProperty(transformedResp.OrderViewRS.TicketDocInfos[0].TicketDocument.ReportingType, 'Airline');
        assertProperty(transformedResp.OrderViewRS.TicketDocInfos[0].TicketDocument.TicketDocNbr, '00121571362043');
        assertProperty(transformedResp.OrderViewRS.TicketDocInfos[0].TicketDocument.Type, '702');
        done();
    });
    it('should retrieve error&warnings from response', async (done) => {
        const soapResponse = await loadSampleFile('OrderCreateRS_error_segment_unavailable.xml');
        const transformedResp: NDCOrderCreateResponse = await processOrderCreateRS(soapResponse);
        expect(transformedResp).toBeInstanceOf(NDCOrderCreateResponse);
        expect(transformedResp.OrderViewRS.Errors).toBeInstanceOf(Array);
        expect(transformedResp.OrderViewRS.Errors.length).toEqual(1);
        expect(transformedResp.OrderViewRS.Errors[0].Type).toEqual('PNR');
        expect(transformedResp.OrderViewRS.Errors[0].ShortText).toEqual('190003389');
        expect(transformedResp.OrderViewRS.Errors[0].Code).toEqual('325');
        expect(transformedResp.OrderViewRS.Errors[0].Owner).toEqual('AAD');
        expect(transformedResp.OrderViewRS.Errors[0].Message).toEqual('Error during booking process. Code: 21, message: Rebooked segment unavailable');
        done();
    });
});
