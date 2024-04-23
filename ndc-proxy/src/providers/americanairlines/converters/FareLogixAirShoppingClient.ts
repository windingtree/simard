import {BaseFareLogixOperationClient} from './BaseFareLogixOperationClient';
import {FarelogixConfiguration} from '../../../env';
import {NDCAirShoppingResponse, NDCItineraryCriteria, NDCPassenger} from '../../../interfaces/ndc';
import {buildAirShoppingRQ, generateTransactionID, processAirShoppingRS} from './airshopping';
import {FarelogixSoapMessageBuilder} from '../utils/soap/soapHeader';
import {logMessage} from '../../../lib/logger';
import {ExtendedSessionContext} from '../../../services/ExtendedSessionContext';

export class FareLogixAirShoppingClient extends BaseFareLogixOperationClient {

    public soapMessageBuilder: FarelogixSoapMessageBuilder = new FarelogixSoapMessageBuilder();

    constructor(flxConfiguration: FarelogixConfiguration) {
        super(flxConfiguration);
    }

    public async searchForFlights(ndcPassengers: NDCPassenger[], ndcItins: NDCItineraryCriteria[], sessionContext: ExtendedSessionContext): Promise<NDCAirShoppingResponse> {
        // shopping request payload preparation
        const airShoppingRQPayload = buildAirShoppingRQ(sessionContext, ndcPassengers, ndcItins, generateTransactionID());
        const airShoppingRQRSOAPMessage = this.soapMessageBuilder.createSoapMessage(sessionContext, airShoppingRQPayload);

        await logMessage(`${this.fareLogixTraceID}_AirShoppingRQ`, airShoppingRQRSOAPMessage);
        // make a call to AirShoppingRQ
        const airShoppingRSOAPMessage = await super.ndcSoapClient.wbsRequest('AirShoppingRQ', airShoppingRQRSOAPMessage);
        await logMessage(`${this.fareLogixTraceID}_AirShoppingRS`, airShoppingRSOAPMessage);

        // process response
        // await logMessage('AirShoppingRS_JSON', JSON.stringify(airShoppingRSPayload, undefined, 2), 'json');
        // tslint:disable-next-line:no-console
        return await processAirShoppingRS(airShoppingRSOAPMessage);
    }
}
