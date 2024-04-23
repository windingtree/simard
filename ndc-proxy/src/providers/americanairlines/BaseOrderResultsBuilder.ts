import {NDCContactInformationProvided, NDCFlight, NDCFlightSegment, NDCPassenger} from '../../interfaces/ndc';
import {
    ExtendedPriceDetails,
    Passenger, Segment,
} from '../../interfaces/glider';
import {convertToGliderPassenger, convertToGliderSegment} from '../../lib/ndc/ndcFormatUtils';
import {Mapping, generateShortUUID} from '../../lib/uuid';
import {NDCOrder, NDCOrderViewRS} from '../../interfaces/ndc';
import {ItinerarySummary, Order, OrderConstructorParameters, OrderStatus, TravelDocuments} from '../../interfaces/glider';
import {BaseResponseBuilder} from './BaseResponseBuilder';
import {FarelogixConfiguration} from '../../env';
import { BaseOrderResponse } from '../../interfaces/glider/order/BaseOrderResponse';
import { OrderProviderDetails } from '../../interfaces/glider/order/OrderProviderDetails';
import {ExtendedSessionContext} from '../../services/ExtendedSessionContext';

export class BaseOrderResultsBuilder extends BaseResponseBuilder<BaseOrderResponse> {
    private readonly ndcBaseOrderResponse: NDCOrderViewRS;
    private orderId: string;

    constructor(private flxConfig: FarelogixConfiguration, ndcBaseOrderResponse: NDCOrderViewRS, existingMapping: Mapping|undefined = undefined, existingOrderId: string = undefined) {
        super(existingMapping);
        this.ndcBaseOrderResponse = ndcBaseOrderResponse;
        this.orderId = existingOrderId; // if order already exists provide orderID to prevent generating new one
    }

    public build(sessionContext: ExtendedSessionContext): BaseOrderResponse {
        this.initialize();
        const ndcOrder: NDCOrder = this.ndcBaseOrderResponse.Orders[0];    // assumption we take only 1st order
        const order: Order = this.convertNdcOrder(this.ndcBaseOrderResponse, ndcOrder, sessionContext);
        const orderId = this.orderId ?? generateShortUUID();
        const response = new BaseOrderResponse({order, orderId});
        response.providerDetails = new OrderProviderDetails(ndcOrder.OrderID, ndcOrder.Owner);
        console.log('response:', response);
        return response;
    }

    /**
     * Initialize any additional data/structures that are needed (e.g. load currency metadata so that prices can be correctly created/converted)
     * @protected
     */
    protected initialize(): void {
        if (Array.isArray(this.ndcBaseOrderResponse.Metadata.CurrencyMetadata)) {
            // initialize currency metadata (decimal points) and conversion rates
            super.initializePriceConverter(this.ndcBaseOrderResponse.Metadata.CurrencyMetadata);
        }
    }
    protected convertNdcOrder(ndcBaseOrderResponse: NDCOrderViewRS, ndcOrder: NDCOrder, sessionContext: ExtendedSessionContext): Order {
        // convert prices
        const {TotalOrderPrice: {Code: currencyCode, Total: totalPrice}} = ndcOrder;
        const totalPriceAmount = super.convertPrice(totalPrice, currencyCode);
        // totalPriceAmount = this.addBookingFeeIfRequired(totalPriceAmount, sessionContext);
        const taxesAmount = super.convertPrice(this.calculateTotalOrderTaxes(ndcOrder), currencyCode);
        // TODO add commission calculation
        const eTickets = ndcBaseOrderResponse.TicketDocInfos.map(ref => ref.TicketDocument.TicketDocNbr);
        const airlineID = this.flxConfig.fareLogixAirlineId;
        const bookingReferences = ndcOrder.BookingReferences.filter(value => value.AirlineID === airlineID).map(ref => ref.ID);

        const travelDocs = new TravelDocuments(eTickets, bookingReferences);

        const params: OrderConstructorParameters = {
            price:  new ExtendedPriceDetails(totalPriceAmount, currencyCode, 0, taxesAmount),
            passengers: this.convertPassengers(ndcBaseOrderResponse.PassengerList, ndcBaseOrderResponse.ContactList),
            itinerary: this.convertSegments(ndcOrder, ndcBaseOrderResponse.FlightList, ndcBaseOrderResponse.FlightSegmentList ),
            options: [],
            restrictions: undefined,        // TODO
            status: OrderStatus.CONFIRMED,
            travelDocuments: travelDocs,
        };
        return new Order(params);
    }
/*
    protected addBookingFeeIfRequired(price: number, sessionContext: ExtendedSessionContext): number {
        if (sessionContext.bookingFeeAmount > 0) {
            price += PriceFactory.convertAmount(sessionContext.bookingFeeAmount, 2);
            // price += super.convertPrice(sessionContext.bookingFeeAmount, sessionContext.bookingFeeCurrencyCode);
        }
        return price;
    }
*/

    protected convertPassengers(passengerList: NDCPassenger[], ContactList: NDCContactInformationProvided[]): Passenger[] {
        const results: Passenger[] = [];
        // iterate over passengers list and convert NDC Pax format to Glider Pax format
        passengerList.forEach(ndcPax => {
            const gliderPax = convertToGliderPassenger(ndcPax);
            if (ndcPax.ContactInfoRef) {
                // there is contact info(email, phone) to be looked up using ConcatInfoRef
                const contacts = [];
                ContactList.filter(value => value.ContactID === ndcPax.ContactInfoRef).map(value => {
                    if (value.EmailAddresses && value.EmailAddresses.length > 0) {
                        contacts.push(...(value.EmailAddresses.map(value1 => value1.EmailAddressValue)));
                    }
                    if (value.Phones && value.Phones.length > 0) {
                        contacts.push(...(value.Phones.map(value1 => value1.PhoneNumber)));
                    }
                });
                gliderPax.contactInformation = contacts;
            }
            results.push(gliderPax);
        });
        return results;
    }

    protected calculateTotalOrderTaxes(ndcOrder: NDCOrder): number {
        let totalTax = 0;
        ndcOrder.OrderItems.forEach(value => {
            totalTax += Number(value.PriceDetail.Taxes.Total);
        });
        return totalTax;
    }
    protected convertSegments( ndcOrder: NDCOrder, ndcFlightsList: NDCFlight[], ndcSegmentsList: NDCFlightSegment[]): ItinerarySummary {
        const gliderSegments: Segment[] = [];
        ndcSegmentsList.forEach(ndcSegment => {
            const gliderSegment = convertToGliderSegment(ndcSegment);
            gliderSegments.push(gliderSegment);
        });
        return new ItinerarySummary(gliderSegments);
    }
}
