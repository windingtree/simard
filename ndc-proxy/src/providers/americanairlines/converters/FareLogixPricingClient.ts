import {BaseFareLogixOperationClient} from './BaseFareLogixOperationClient';
import {FarelogixConfiguration} from '../../../env';
import {
    NDCOffer,
    NDCOfferPriceResponse,
    NDCPassenger
} from '../../../interfaces/ndc';
import {generateTransactionID} from './airshopping';
import {createSoapMessage} from '../utils/soap/soapHeader';
import {logMessage} from '../../../lib/logger';
import {buildOfferPriceRQ, processOfferPriceRS} from './offerprice';

export class FareLogixPricingClient extends BaseFareLogixOperationClient {

    constructor(flxConfiguration: FarelogixConfiguration) {
        super(flxConfiguration);
    }

    public async offerPricing(responseID: string, offer: NDCOffer, passengers: NDCPassenger[]): Promise<NDCOfferPriceResponse> {

        // tslint:disable-next-line:no-console
        //////// PRICING //////////
        // await logMessage('OfferPriceRQ_JSON', JSON.stringify(offer, undefined, 2), 'json');
        const offerPriceRQPayload = buildOfferPriceRQ(this.flxConfig, passengers, offer, responseID, generateTransactionID());

        const offerPriceRQSOAPMessage = createSoapMessage(this.flxConfig, offerPriceRQPayload);
        await logMessage(`${this.fareLogixTraceID}_OfferPriceRQ`, offerPriceRQSOAPMessage);

        // make a call to OfferPriceRQ
        const offerPriceRSSOAPMessage = await this.ndcSoapClient.wbsRequest('OfferPriceRQ', offerPriceRQSOAPMessage);
        await logMessage(`${this.fareLogixTraceID}_OfferPriceRS`, offerPriceRSSOAPMessage);

        const offerPriceRSPayload: NDCOfferPriceResponse = await processOfferPriceRS(offerPriceRSSOAPMessage);
        // await logMessage('OfferPriceRS_JSON', JSON.stringify(offerPriceRSPayload, undefined, 2), 'json');
        // tslint:disable-next-line:no-console
        return offerPriceRSPayload;
    }

}
