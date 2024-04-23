import {BaseFareLogixOperationClient} from './BaseFareLogixOperationClient';
import {FarelogixConfiguration} from '../../../env';
import {
    NDCOffer,
    NDCPassenger,
    NDCPaymentDetails
} from '../../../interfaces/ndc';
import {generateTransactionID} from './airshopping';
import {createSoapMessage} from '../utils/soap/soapHeader';
import {logMessage} from '../../../lib/logger';
import {NDCOrderCreateResponse} from '../../../interfaces/ndc';
import {OrderCreateRQBuilder, processOrderCreateRS} from './ordercreate';
import { NDCOrderRetrievalResponse } from '../../../interfaces/ndc/order/NDCOrderRetrievalResponse';
import { OrderRetrieveRQBuilder } from './orderretrieve/OrderRetrieveRQBuilder';
import { processOrderRetrievalRS } from './orderretrieve/OrderRetrieveRSProcessor';

export class FareLogixOrderClient extends BaseFareLogixOperationClient {

    constructor(flxConfiguration: FarelogixConfiguration) {
        super(flxConfiguration);
    }

    public async orderCreate(responseID: string, offer: NDCOffer, passengers: NDCPassenger[], paymentDetails: NDCPaymentDetails, ndcSeatSelectionOffer: NDCOffer, usePciProxy: boolean = true): Promise<NDCOrderCreateResponse> {
        //////// ORDER CREATE //////////
        // tslint:disable-next-line:no-console
        // console.timeLog('booking');
        // await logMessage('OrderCreateRQ_JSON', JSON.stringify(offer, undefined, 2), 'json');
        const orderCreateRQPayload = OrderCreateRQBuilder(this.flxConfig, passengers, offer, paymentDetails, generateTransactionID(), ndcSeatSelectionOffer);

        const orderCreateRQSOAPMessage = createSoapMessage(this.flxConfig, orderCreateRQPayload);

        // make a call to OrderCreateRQ
        const requestName = usePciProxy === true ? 'OrderCreateRQ_PCIProxy' : 'OrderCreateRQ';
        await logMessage(`${this.fareLogixTraceID}_OrderCreateRQ`, orderCreateRQSOAPMessage);
        const orderCreateRSSOAPMessage = await this.ndcSoapClient.wbsRequest(requestName, orderCreateRQSOAPMessage);
        await logMessage(`${this.fareLogixTraceID}_OrderCreateRS`, orderCreateRSSOAPMessage);
        const ndcOrderCreate: NDCOrderCreateResponse =  await processOrderCreateRS(orderCreateRSSOAPMessage);
        // tslint:disable-next-line:no-console
        return ndcOrderCreate;
    }

    public async retrieveOrderById(orderID: string): Promise<NDCOrderRetrievalResponse> {
        //////// ORDER RETRIEVE //////////
        // tslint:disable-next-line:no-console
        // console.timeLog('booking');
        // await logMessage('OrderRetrieveRQ_JSON', JSON.stringify(offer, undefined, 2), 'json');
        const orderRetrieveRQPayload = OrderRetrieveRQBuilder(this.flxConfig, orderID, generateTransactionID());

        const orderRetrieveRQSOAPMessage = createSoapMessage(this.flxConfig, orderRetrieveRQPayload);

        // make a call to OrderRetrieveRQ
        const requestName = 'OrderRetrieveRQ';
        await logMessage('AA_OrderRetrieveRQ', orderRetrieveRQSOAPMessage);
        const orderRetrieveRSSOAPMessage = await this.ndcSoapClient.wbsRequest(requestName, orderRetrieveRQSOAPMessage);
        await logMessage('AA_OrderRetrieveRS', orderRetrieveRSSOAPMessage);
        const ndcOrderRetrieval: NDCOrderRetrievalResponse =  await processOrderRetrievalRS(orderRetrieveRSSOAPMessage);
        // tslint:disable-next-line:no-console

        return ndcOrderRetrieval;
    }

}
