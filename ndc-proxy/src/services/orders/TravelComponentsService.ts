import {Inject, Service} from 'typedi';
import {CreateOrderResponse, Order, Segment} from '../../interfaces/glider';
import {SimardClient} from '../../lib/simard';
import {SMDTravelComponentAir, SMDTravelComponentAirSegment} from '../../interfaces/simard';
import moment from 'moment';
import {LoggerFactory} from '../../lib/logger';

@Service()
export class TravelComponentsService {

    public static convertSegment(segment: Segment): SMDTravelComponentAirSegment {
        let carrierCode = segment.operator.iataCode;
        if (segment.operator.iataCodeM) {
            carrierCode = segment.operator.iataCodeM;
        }
        let flightNumberStr = segment.operator.flightNumber || '';
        if (flightNumberStr.length > 4) {
            // probably due to a defect, sometimes flight number also contains carrier code (e.g. AA1234)
            // in this case we need to remove carrier code from the begining
            flightNumberStr = flightNumberStr.substring(flightNumberStr.length - 4);
        }
        flightNumberStr = flightNumberStr.padStart(4, '0');    // SimardPay requires 4 chars length (pad it with 0)
        const airSegment: SMDTravelComponentAirSegment = {
            arrivalTime: segment.arrivalTime.toISOString(),
            departureTime: segment.departureTime.toISOString(),
            destination: segment.destination.iataCode,
            origin: segment.origin.iataCode,
            flightNumber: flightNumberStr,
            iataCode: carrierCode,
            serviceClass: 'Y',          // FIXME - replace hardoded with class retrieved from carrier
        };
        return airSegment;
    }
    public static convertOrder(order: Order): SMDTravelComponentAir {
        let eTicket;
        if (Array.isArray(order?.travelDocuments?.etickets) && order.travelDocuments.etickets.length > 0) {
            eTicket = order.travelDocuments.etickets[0];    // FIXME first eTicket may not necessarily be flight ticket, it may be EMD
        } else {
            // from time to time we get order without eTicket, in this case we need to set some dummy value to pass validation in SimardPay
            eTicket = '00000000000000';
        }
        let pnr;
        if (Array.isArray(order?.travelDocuments?.bookings) && order.travelDocuments.bookings.length > 0) {
            pnr = order.travelDocuments.bookings[0];
        }
        const passengerEmails = [];
        order.passengers.forEach(passenger => {
            // check if line looks like email address
            passenger.contactInformation.forEach(contact => {
                if (contact.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    passengerEmails.push(contact);
                }
                }
            );
        });
        const airComponent: SMDTravelComponentAir = {
            componentType: 'air',
            documentType: 'TKT',
            ... eTicket && { documentNumber: eTicket },
            ... pnr && { recordLocator: pnr },
            documentIssuanceDate: moment().format('YYYY-MM-DD'),
            segments: order.itinerary.segments.map(segment => TravelComponentsService.convertSegment(segment)),
            amounts: {
                total: order.price.public.toFixed(2),
                base: (order.price.public - order.price.taxes).toFixed(2),
                taxes: [],
            },
            contactEmail: passengerEmails.join(','),
        };
        return airComponent;
    }

    @Inject()
    private simardClient: SimardClient;

    private log = LoggerFactory.createLogger('order service');

    public async updateTravelComponentsForToken(tokenId: string, createOrderResponse: CreateOrderResponse): Promise<boolean> {
        // validate it
        try {
            const component: SMDTravelComponentAir = TravelComponentsService.convertOrder(createOrderResponse.order);
            const success: boolean = await this.simardClient.createTokenComponents(tokenId, [component]);
            if (!success) {
                this.log.error(`Update token travel components did not complete for token ${tokenId}, no error returned from Simard Pay`);
            }
            return success;
        } catch (err) {
            // in case it fails to update token we don't want to fail booking confirmation
            // error needs to be logger but flow should continue
            this.log.error(`Failed to update token travel components for token ${tokenId}, error:`, err);
            return false;
        }
    }
}
