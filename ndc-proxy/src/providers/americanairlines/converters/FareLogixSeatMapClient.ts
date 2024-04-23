import {BaseFareLogixOperationClient} from './BaseFareLogixOperationClient';
import {FarelogixConfiguration} from '../../../env';
import {
    NDCOffer,
    NDCOfferPriceRS,
    NDCPassenger
} from '../../../interfaces/ndc';
import {generateTransactionID} from './airshopping';
import {createSoapMessage} from '../utils/soap/soapHeader';
import {logMessage} from '../../../lib/logger';
import {NDCSeatAvailabilityResponse} from '../../../interfaces/ndc';
import {collectSegmentsForSeatmapRequest} from './seatavailability/collectSegmentsForSeatmapRequest';
import {buildSeatAvailabilityRQ, processSeatAvailabilityRS} from './seatavailability';

export class FareLogixSeatMapClient extends BaseFareLogixOperationClient {
    constructor(flxConfiguration: FarelogixConfiguration) {
        super(flxConfiguration);
    }
    public async seatAvailability(responseID: string, offer: NDCOffer, passengers: NDCPassenger[], offerPriceRS: NDCOfferPriceRS): Promise<NDCSeatAvailabilityResponse> {
        // tslint:disable-next-line:no-console
        // console.timeLog('Seatavailability');
        //////// SEAT AVAILABILITY //////////
        // extract segment IDs for which we need to request seatmap (e.g. to exclude codeshare flights for example)
        const segmentRefs = collectSegmentsForSeatmapRequest(offer, offerPriceRS);
        const seatAvailabilityRQPayload = buildSeatAvailabilityRQ(this.flxConfig, passengers, offer, segmentRefs, responseID, generateTransactionID());
        const seatAvailabilityRQSoapMessage = createSoapMessage(this.flxConfig, seatAvailabilityRQPayload);
        await logMessage(`${this.fareLogixTraceID}_SeatAvailabilityRQ`, seatAvailabilityRQSoapMessage);

        const seatAvailabilityRSSOAPMessage = await this.ndcSoapClient.wbsRequest('SeatAvailabilityRQ', seatAvailabilityRQSoapMessage);
        await logMessage(`${this.fareLogixTraceID}_SeatAvailabilityRS`, seatAvailabilityRSSOAPMessage);
        const ndcSeatAvailabilityResponse = processSeatAvailabilityRS(seatAvailabilityRSSOAPMessage);
        // tslint:disable-next-line:no-console
        return ndcSeatAvailabilityResponse;
    }

}
