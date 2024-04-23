import {Inject, Service} from 'typedi';
import {
    CardBrand,
    CardType,
    CreateOrderResponse,
    Order,
    OrderProcessingStage,
    OrderStatus,
    OrderStatusResponse,
    Passenger,
    PaymentDetails
} from '../../interfaces/glider';
import {SimardClient} from '../../lib/simard';
import {SMDCardBrand, SMDCardType, SMDGuaranteeDetails, SMDTokenDetails} from '../../interfaces/simard';
import {BaseGliderException, ErrorCodes, HttpStatusCode} from '../../api/errors';
import {SessionContext} from '../SessionContext';
import {BusinessRulesEngine} from '../bre/BusinessRulesEngine';
import {OffersStorageService} from '../offers/OffersStorageService';
import {EOffer} from '../../database/models/EOffer';
import {GuaranteeType} from '../bre/GuaranteeType';
import {ProvidersFactory} from '../providersfactory/ProvidersFactory';
import {BaseFarelogixFlightProvider} from '../../providers/americanairlines/BaseFarelogixFlightProvider';
import {EOrderUpdateOptions, OrdersStorageService} from './OrdersStorageService';
import {EOrder} from '../../database/models/EOrder';
import {OrderRetrievalResponse} from '../../interfaces/glider/order/OrderRetrievalResponse';
import {OrderSyncStatus} from '../../interfaces/glider/order/OrderSyncStatua';
import {OrderProviderDetails} from '../../interfaces/glider/order/OrderProviderDetails';
import {TravelComponentsService} from './TravelComponentsService';
import {BookingFeeManagerFactory} from '../../lib/payments';
import {ExtendedSessionContext} from '../ExtendedSessionContext';
import {LoggerFactory} from '../../lib/logger';

@Service()
export class OrdersService {
    private static cardTokenToPaymentDetails(cardToken: SMDTokenDetails): PaymentDetails {
        const paymentDetails = new PaymentDetails();
        paymentDetails.cardDetailsMasked = cardToken.maskedAccountNumber !== undefined && cardToken.maskedAccountNumber !== null;    // this will trigger usage of PCI Proxy
        paymentDetails.cardNumber = cardToken.aliasAccountNumber;
        paymentDetails.cvcCode = cardToken.aliasCvv;
        paymentDetails.cardExpiryYear = cardToken.expiryYear;
        paymentDetails.cardExpiryMonth = cardToken.expiryMonth;
        paymentDetails.cardHolderName = cardToken.cardholderName;
        paymentDetails.billingAddressStreet = cardToken.billingAddress.street;
        paymentDetails.billingAddressCity = cardToken.billingAddress.cityName;
        paymentDetails.billingAddressState = cardToken.billingAddress.stateProv;
        paymentDetails.billingAddressPostal = cardToken.billingAddress.postalCode;
        paymentDetails.billingAddressCountryCode = cardToken.billingAddress.countryCode;
        switch (cardToken.brand) {
            case SMDCardBrand.visa:
                paymentDetails.cardBrand = CardBrand.visa;
                break;
            case SMDCardBrand.mastercard:
                paymentDetails.cardBrand = CardBrand.mastercard;
                break;
            case SMDCardBrand.amex:
                paymentDetails.cardBrand = CardBrand.amex;
                break;
            case SMDCardBrand.bancontact:
                paymentDetails.cardBrand = CardBrand.bancontact;
                break;
            case SMDCardBrand.diners:
                paymentDetails.cardBrand = CardBrand.diners;
                break;
            case SMDCardBrand.discover:
                paymentDetails.cardBrand = CardBrand.discover;
                break;
            case SMDCardBrand.jcb:
                paymentDetails.cardBrand = CardBrand.jcb;
                break;
            case SMDCardBrand.maestro:
                paymentDetails.cardBrand = CardBrand.maestro;
                break;
            case SMDCardBrand.uatp:
                paymentDetails.cardBrand = CardBrand.uatp;
                break;
            case SMDCardBrand.unionpay:
                paymentDetails.cardBrand = CardBrand.unionpay;
                break;
            case SMDCardBrand.electron:
                paymentDetails.cardBrand = CardBrand.electron;
                break;
            default:
                throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Unknown card brand :${cardToken.brand}`, ErrorCodes.INVALID_CARD_DETAILS);
        }

        if (cardToken.type === SMDCardType.credit) {
            paymentDetails.cardType = CardType.credit;
        } else if (cardToken.type === SMDCardType.debit) {
            paymentDetails.cardType = CardType.debit;
        } else {
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Unknown card type :${cardToken.type}`, ErrorCodes.INVALID_CARD_DETAILS);
        }

        return paymentDetails;
    }

    @Inject()
    private simardClient: SimardClient;

    @Inject()
    private bookingFeeManagerFactory: BookingFeeManagerFactory;

    @Inject()
    private businessRulesEngine: BusinessRulesEngine;

    @Inject()
    private providersFactory: ProvidersFactory;

    @Inject()
    private offersStorageService: OffersStorageService;

    @Inject()
    private travelComponentsService: TravelComponentsService;

    @Inject()
    private ordersStorageService: OrdersStorageService;

    private log = LoggerFactory.createLogger('order service');
    public async createWithOffer(context: SessionContext, offerId: string, guaranteeId: string, passengers: Map<string, Passenger>): Promise<CreateOrderResponse> {
        this.log.debug(`Starting creating order, offerID:${offerId}, guaranteeID:${guaranteeId}`);
        // first let's check if order for offerID was already created (or is in progress)
        await this.ensureOrderDoesNotExist(offerId);

        const offer: EOffer = await this.offersStorageService.findOfferByOfferId(offerId);
        if (!offer) {
            this.log.error(`Cannot create order for offer:${offerId}, offer was not found in database, offer expired or not found`);
            // await this.updateOrderStatus(offerId, OrderStatus.CREATION_FAILED, orderRecord); // update order status before return
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Offer expired or not found:${offerId}`, ErrorCodes.OFFER_NOT_FOUND);
        }
        // now we know what provider(UA,AA,..) we are using to make a booking,
        // so we can get business rules that depend on the provider
        const extendedContext: ExtendedSessionContext = await this.businessRulesEngine.createExtendedSessionContext(context, offer.providerID);
        const orderRecord: EOrderUpdateOptions = {orgID: context.clientORGiD, offerID: offerId, guaranteeID: guaranteeId, providerID: offer.providerID};

        // save temporary order in DB (with status IN_PROGRESS to prevent double creation), at this stage orderID = offerID (will be replaced with real orderID once its created)
        await this.ordersStorageService.saveOrderInProgress(offerId, orderRecord);

        const depositType = extendedContext.depositType;
        let createOrderResponse: CreateOrderResponse;
        try {
            orderRecord.guaranteeType = depositType;
            this.log.info(`Start creating an order, offerID:${offerId}, guaranteeID:${guaranteeId}, provider:${offer.providerID}, deposit type:${depositType}`);
            if (depositType === GuaranteeType.TOKEN) {
                createOrderResponse = await this.createOrderWithToken(offer.providerID, offerId, guaranteeId, passengers, extendedContext);
            } else if (depositType === GuaranteeType.DEPOSIT) {
                createOrderResponse = await this.createOrderWithGuarantee(offer.providerID, offerId, guaranteeId, passengers, extendedContext);
            }
            // make a call to Simard Pay and store some info about the booking there (associated with guaranteeID
            // this should never fail here as it's not crucial for the booking
            const tokenUpdateResult = await this.travelComponentsService.updateTravelComponentsForToken(guaranteeId, createOrderResponse);
            if (!tokenUpdateResult) {
                this.log.warn(`Failed to update travel components for an order`);
            }
            // here order creation completed, update status in DB and return
            await this.updateOrderConfirmation(offerId, createOrderResponse.orderId, createOrderResponse.order, createOrderResponse.providerDetails, createOrderResponse.tokenDetails);
            delete createOrderResponse.providerDetails; // we do not need to send this to the client
            delete createOrderResponse.tokenDetails;    // remove token details!!! (TODO refactor this to avoid this deletion)
            this.log.info(`Created order, orderID:${createOrderResponse.orderId}`);
            return createOrderResponse;
        } catch (err: any) {
            this.log.error(`Failed to create order for offer:${offerId}, error:${err.message}`);
            await this.updateOrderStatus(offerId, OrderStatus.CREATION_FAILED, orderRecord); // update order status before return
            throw err;
        }
        // if we reached this, it means unknown deposit type was returned - it's a problem
        await this.updateOrderStatus(offerId, OrderStatus.CREATION_FAILED, orderRecord); // update order status before return
        throw new BaseGliderException(HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR, `Unsupported deposit type`, ErrorCodes.INVALID_GUARANTEE_TYPE);
    }

    /**
     * Check if booking fee is required. If so - authorize required amount and return chargeID which is needed to capture or refund.
     * If booking fee is not required, return undefined
     * offerId is included in authorization as reference to this transaction for some payment providers e.g DataTrans
     */
    public async authorizeBookingFeeAmountIfRequired(tokenDetails: SMDTokenDetails, context: ExtendedSessionContext, offerId: string): Promise<string|undefined> {
        const bookingFeeAmount = context.bookingFeeAmount;
        const bookingFeeCurrency = context.bookingFeeCurrencyCode;
        this.log.debug(`Booking fee for this transaction: ${bookingFeeAmount}${bookingFeeCurrency}`);

        // get booking fee manager
        const bookingFeeManager = this.bookingFeeManagerFactory.getBookingFeeManager(context.bookingFeeChargeProvider);

        if (bookingFeeAmount > 0) {
            const chargeID = await bookingFeeManager.authorizeAmountFromTokenizedCard(tokenDetails, bookingFeeAmount, bookingFeeCurrency, bookingFeeManager.bookingFeeDescription, offerId);
            if (!chargeID) {
                throw new BaseGliderException(HttpStatusCode.CLIENT_PAYMENT_REQUIRED, `Failed to authorize booking fee`, ErrorCodes.INSUFFICIENT_FUNDS);
            }
            return chargeID;
        }
        return undefined;
    }

    /**
     * If booking fee was required, we need to also add information about captured booking fee in the order create response
     * We need to increase final price by the booking fee amount
     */
    public decorateFinalPriceWithBookingFeeIfRequired(confirmation: CreateOrderResponse, context: ExtendedSessionContext): void {
        // FIXME: this is duplication of similar function in offer pricing, refactor and externalize this
        const bookingFeeAmount = context.bookingFeeAmount;
        if (bookingFeeAmount > 0) {
            // TODO replace this with dedicated library for math on amounts
            const amountInMainUnits = bookingFeeAmount / 100;
            confirmation.order.price.public += amountInMainUnits;
        }
    }

    /**
     * Capture previously authorized booking fee if 'chargeID' is defined. Otherwise do nothing
     */
    public async captureBookingFeeIfChargeExists(chargeID: string, context: ExtendedSessionContext, offerId: string): Promise<void> {
        if (!chargeID) {
            return;
        }

        const {bookingFeeChargeProvider, bookingFeeAmount, bookingFeeCurrencyCode} = context;

        // get booking fee manager
        const bookingFeeManager = this.bookingFeeManagerFactory.getBookingFeeManager(bookingFeeChargeProvider);

        try {
            await bookingFeeManager.captureCharge(chargeID, bookingFeeAmount, bookingFeeCurrencyCode, offerId);
        } catch (err) {
            this.log.error(`Failed to charge booking fee!${err}, booking flow will continue though`);
        }
    }

    /**
     * Refund previously authorized booking fee if 'chargeID' is defined. Otherwise do nothing
     */
    public async refundBookingFeeIfChargeExists(chargeID: string|undefined, context: ExtendedSessionContext, offerId: string): Promise<void> {
        if (!chargeID) {
            return;
        }

        const {bookingFeeChargeProvider, bookingFeeAmount, bookingFeeCurrencyCode} = context;

        // get booking fee manager
        const bookingFeeManager = this.bookingFeeManagerFactory.getBookingFeeManager(bookingFeeChargeProvider);

        try {
            await bookingFeeManager.revertCharge(chargeID, bookingFeeAmount, bookingFeeCurrencyCode, offerId);
        } catch (err) {
            this.log.error(`Failed to revert booking fee for chargeID:${chargeID}, error:${err}, manual intervention required`);
        }
    }
    public async orderStatus(context: SessionContext, offerID: string): Promise<OrderStatusResponse> {
        const orderRecord: EOrder = await this.ordersStorageService.findOrderByOfferId(offerID);
        const response = new OrderStatusResponse();
        if (!orderRecord) {
            response.status = OrderProcessingStage.NOT_FOUND;
        } else {
            response.status = orderRecord.processingStage;
            if (orderRecord.processingStage === OrderProcessingStage.COMPLETED) {
                response.confirmation = new CreateOrderResponse();
                response.confirmation.orderId = orderRecord.orderID;
                response.confirmation.order = orderRecord.confirmation;
            }
        }
        return response;
    }

    public async retrieveOrderByOrderId(context: SessionContext, orderID: string): Promise<OrderRetrievalResponse> {
        // find the providerID for for the given OrderID in DB
        const orderInDB = await this.ordersStorageService.findOrderByOrderId(orderID);
        if (!orderInDB) {
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Order with OrderID ${orderID} not found`, ErrorCodes.ORDER_NOT_FOUND);
        }

        // build provider
        const providerID = orderInDB.providerID;
        const provider: BaseFarelogixFlightProvider = this.providersFactory.getFlightProviderById(providerID);

        const extendedContext: ExtendedSessionContext = await this.businessRulesEngine.createExtendedSessionContext(context, providerID);

        let orderResponse: OrderRetrievalResponse;
        if (provider.isRetreveFromAPISupported()) {
            // if this provider supports RetrieveOrderRQ call API
            const providerOrderID = orderInDB.providerDetails.orderID;
            orderResponse = await provider.retrieveOrder(providerOrderID, orderID, extendedContext);
        } else {
            // otherwise return DB result
            orderResponse = new OrderRetrievalResponse({order: orderInDB.confirmation, orderId: orderID, syncStatus: OrderSyncStatus.CACHED});
        }

        // strip providerDetails
        delete orderResponse.providerDetails;

        return orderResponse;
    }

    protected async createOrderWithToken(providerID: string, offerId: string, guaranteeId: string, passengers: Map<string, Passenger>, context: ExtendedSessionContext): Promise<CreateOrderResponse> {
        // retrieve token
        const cardToken: SMDTokenDetails = await this.simardClient.retrieveToken(guaranteeId);
        // validate it
        await this.validateCardToken(cardToken, offerId);
        // convert it to paymentdetails
        const paymentDetails: PaymentDetails = OrdersService.cardTokenToPaymentDetails(cardToken);

        // if needed, authorize booking fee amount (or just do nothing)
        const chargeID = await this.authorizeBookingFeeAmountIfRequired(cardToken, context, offerId);

        // create order
        let confirmation;
        try {
            confirmation = await this.createOrder(providerID, offerId, passengers, paymentDetails, context);
            confirmation.tokenDetails = cardToken;
            // charge booking fee (important - if it fails, it should not prevent order confirmation to be returned to the client
            await this.captureBookingFeeIfChargeExists(chargeID, context, offerId);
            // if there was booking fee, we need to increase the total price with booking fee amount
            this.decorateFinalPriceWithBookingFeeIfRequired(confirmation, context);
        } catch (err: any) {
            // if booking fee amount was previously authorized - refund it
            await this.refundBookingFeeIfChargeExists(chargeID, context, offerId);
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Failed to create an order: ${err.message}`, ErrorCodes.ORDER_CREATION_FAILED);
        }

        // cancel token
        // TODO - cancel token (????)

        return confirmation;
    }

    protected async createOrderWithGuarantee(providerID: string, offerId: string, guaranteeId: string, passengers: Map<string, Passenger>, extendedContext: ExtendedSessionContext): Promise<CreateOrderResponse> {
        // retrieve guarantee
        const guaranteeDetails: SMDGuaranteeDetails = await this.simardClient.getGuarantee(guaranteeId);
        // validate it
        if (!this.validateGuarantee(guaranteeDetails)) {
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, 'Invalid guarantee', ErrorCodes.INVALID_CARD_GUARANTEE);
        }
        // convert it to paymentdetails
        const paymentDetails: PaymentDetails = getBusinessPaymentCard(providerID);
        // create order
        let confirmation;
        try {
            confirmation = await this.createOrder(providerID, offerId, passengers, paymentDetails, extendedContext);
            confirmation.tokenDetails = guaranteeDetails;
        } catch (err: any) {
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Failed to create an order: ${err.message}`, ErrorCodes.ORDER_CREATION_FAILED);
        }
        // claim guarantee
        // TODO - claim
        return confirmation;
    }

    private async ensureOrderDoesNotExist(offerId: string): Promise<void> {
        const orderDbRecord = await this.ordersStorageService.findOrderByOfferId(offerId);
        if (orderDbRecord) {
            this.log.error(`Order for offer:${offerId} already exists or is in progress, order:${orderDbRecord.toString()}`);
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, 'Order for this offerID was already created or is in progress', ErrorCodes.ORDER_ALREADY_EXIST_OR_IN_PROGRESS);
        }
    }

    private async updateOrderConfirmation(orderId: string, newOrderId: string, order: Order, providerDetails: OrderProviderDetails, tokenDetails: any): Promise<void> {
        try {
            await this.ordersStorageService.updateOrderDetails(orderId, {processingStage: OrderProcessingStage.COMPLETED, orderID: newOrderId, confirmation: order, providerDetails, tokenDetails});
        } catch (err: any) {
            this.log.error(`Cannot update order status!!!! OrderID:${orderId}, new status:${status}, error:${err.message}`);
        }
    }

    private async updateOrderStatus(orderId: string, status: OrderStatus, orderRecord: EOrderUpdateOptions): Promise<void> {
        try {
            await this.ordersStorageService.updateOrderDetails(orderId, Object.assign({}, orderRecord, {processingStage: status}));
        } catch (err: any) {
            this.log.error(`Cannot update order status!!!! OrderID:${orderId}, new status:${status}, error:${err.message}`);
        }
    }

    private async validateCardToken(token: SMDTokenDetails, offerId: string): Promise<void> {
        const offer: EOffer = await this.offersStorageService.findOfferByOfferId(offerId);
        // we may have tokenized card here or amex card token
        // in case of amex we will have amount field populated and here we need to validate if amount/currency are OK here
        if (token.amount) {
            const tokenAmount = parseFloat(token.amount);
            if (offer.price > tokenAmount) {
                throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Insufficient authorized amount ${tokenAmount}`, ErrorCodes.INSUFFICIENT_FUNDS);
            }
            if (token.currency !== offer.currency) {
                throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Invalid payment currency ${token.currency}`, ErrorCodes.INSUFFICIENT_FUNDS);
            }
        }
    }
    private async createOrder(providerID: string, offerId: string, passengers: Map<string, Passenger>, paymentDetails: PaymentDetails, extendedContext: ExtendedSessionContext): Promise<CreateOrderResponse> {
        try {
            const provider: BaseFarelogixFlightProvider = this.providersFactory.getFlightProviderById(providerID);
            const order: CreateOrderResponse = await provider.createOrder(offerId, passengers, paymentDetails, extendedContext);
            this.log.info(`Create order succeeded, providerID:${providerID}, offerID: ${offerId}, orderID:${order.orderId}`);
            return order;
        } catch (err: any) {
            this.log.info(`Create order failed, providerID:${providerID}, offerID: ${offerId}, error:${err.message}`);
            throw err;
        }
    }
    private async validateGuarantee(guarantee: SMDGuaranteeDetails): Promise<boolean> {
        return true;
    }
}

function getBusinessPaymentCard(providerID: string): PaymentDetails {
    return undefined;
}
