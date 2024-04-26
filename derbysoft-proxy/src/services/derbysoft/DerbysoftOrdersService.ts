import {
  OrderProcessingStage,
  OrderProviderDetails,
  PricedOffer,
} from "@simardwt/winding-tree-types";
import {
  ErrorCodes,
  generateUUID,
  getLogger,
  HttpStatusCode,
  SimardClient,
  SMDTokenDetails,
  SMDTravelComponentHotel,
} from "@simardwt/winding-tree-utils";
import { plainToInstance } from "class-transformer";
import Container, { Inject, Service } from "typedi";
import { DerbysoftSupplierClient } from "../../clients/DerbysoftSupplierClient";
import { cardTokenToCardPayment } from "../../converters/common/cardConverter";
import { DerbysoftOrderConverter } from "../../converters/order/DerbysoftOrderConverter";
import { DerbysoftRetrieveOrderConverter } from "../../converters/order/DerbysoftRetrieveOrderConverter";
import {
  BookingUsbBookReservationResponse,
  BookingUsbQueryReservationDetailResponse,
  ReservationIds,
} from "@simardwt/derbysoft-types";
import { Config, ConfigService } from "../common/ConfigService";
import { OffersMetadataService } from "../offers/OffersMetadataService";
import { BaseOrdersService } from "../orders/BaseOrdersService";
import { EOrderUpdateOptions } from "../orders/OrdersStorageService";
import {
  CreateWithOfferResponse,
  OrderCancellationResponse,
  OrderStatus,
  PassengerBooking,
} from "@windingtree/glider-types/dist/accommodations";
import { DerbysoftPricingMetadata, HotelOTAError } from "../../types";
import { SessionContext } from "../../types/shared/SessionContext";
import { coerceArray } from "../../utils/generalUtils";
import { extractTravelComponentFromPricingMetaData } from "./DerbysoftUtils";
import { EOrder } from "../../database/models/EOrder";
import { DerbysoftError } from "../../utils/derbysoftErrorUtils";
import { Suppliers, TSupplierId, getSupplierById } from "../../types/shared/Suppliers";
import { DerbysoftGhostBookingsService } from "./DerbysoftGhostBookingsService";

@Service()
export class DerbysoftOrdersService extends BaseOrdersService {
  @Inject()
  private derbysoftOrderConverter: DerbysoftOrderConverter;

  @Inject()
  private derbysoftRetrieveOrderConverter: DerbysoftRetrieveOrderConverter;

  private get offersMetadataService(): OffersMetadataService {
    return Container.get<OffersMetadataService>(OffersMetadataService);
  }

  private get simardClient(): SimardClient {
    return Container.get<SimardClient>(SimardClient);
  }

  private _distributorId: string;
  private _bookingAccessToken: string;
  private _bookingBaseURL: string;
  private _shoppingAccessToken: string;
  private _shoppingBaseURL: string;
  private _derbysoftSupplierClient: DerbysoftSupplierClient;
  private _suppliers: Suppliers;
  private usePciProxy = true;
  private log = getLogger(__filename, "derbysoft-orders");

  constructor(useEnvConfig = true) {
    super("DERBYSOFT");
    this.initialize(useEnvConfig);
    this._derbysoftSupplierClient = new DerbysoftSupplierClient(
      this.distributorId,
      this._bookingAccessToken,
      this.bookingBaseURL,
      this._shoppingAccessToken,
      this.shoppingBaseURL
    );
  }

  public get derbysoftSupplierClient(): DerbysoftSupplierClient {
    return this._derbysoftSupplierClient;
  }

  public get distributorId(): string {
    return this._distributorId;
  }

  public get shoppingAccessToken(): string {
    return this._shoppingAccessToken;
  }

  public get bookingAccessToken(): string {
    return this._bookingAccessToken;
  }

  public get shoppingBaseURL(): string {
    return this._shoppingBaseURL;
  }

  public get bookingBaseURL(): string {
    return this._bookingBaseURL;
  }

  private get suppliers(): Suppliers {
    return this._suppliers;
  }

  private get ghostBookingsService(): DerbysoftGhostBookingsService {
    return Container.get<DerbysoftGhostBookingsService>(DerbysoftGhostBookingsService);
  }

  private initialize(useEnvConfig: boolean): void {
    // populate config values from config source (.env OR httpService)
    const configService = new ConfigService(useEnvConfig);
    const config = configService.getConfig("derbysoft") as Config["derbysoft"];
    this._distributorId = config["distributorId"];
    this._shoppingAccessToken = config["shoppingAccessToken"];
    this._bookingAccessToken = config["bookingAccessToken"];
    this._bookingBaseURL = config["bookingBaseURL"];
    this._shoppingBaseURL = config["shoppingBaseURL"];
    this._suppliers = config["suppliers"];
    this.usePciProxy = configService.getConfig("pciProxy")["enabled"];
  }

  // method uses a token guarantee and PCI-proxy
  public async createOrderWithOfferID(
    context: SessionContext,
    pricedOfferId: string,
    guaranteeId: string,
    passengers: { [k: string]: PassengerBooking },
    remarks?: string[]
  ): Promise<CreateWithOfferResponse> {
    // ensure an order has not been created for this priced offer
    await this.ordersStorageService.assertNoExistingOrder(pricedOfferId);

    // get token from guarantee from Simard-Pay
    const cardToken = await this.simardClient.retrieveToken(guaranteeId);

    const pricingMetadata = await this.retrievePricingMetadata(pricedOfferId, context);

    // TO-DO: Token validation
    await this.validateCardToken(cardToken, pricingMetadata);

    // build masked credit card details with token
    const cardPayment = cardTokenToCardPayment(cardToken);

    // initialize order - in progress
    const orderId = generateUUID(); // new order ID
    const orderRecord: EOrderUpdateOptions = {
      offerID: pricedOfferId,
      guaranteeID: guaranteeId,
      providerID: "DERBYSOFT",
      orgID: context.clientOrgId, // attach order to client/buyer OrgID
      providerDetails: new OrderProviderDetails(undefined, context.supplierId), // order ID from supplier is unknown initially
    };

    // build derbysoft booking RQ from priced offer metadata
    const derbysoftOrderRequest = await this.derbysoftOrderConverter.WtToDerbysoftRequest(
      context,
      { offerId: pricedOfferId, passengers, guaranteeId },
      cardPayment,
      pricingMetadata,
      orderId,
      remarks
    );

    const contactEmail = derbysoftOrderRequest.params.contactPerson.email;

    let derbysoftOrderResponse: BookingUsbBookReservationResponse;

    try {
      // proxy booking request to derbysoft via PCI-proxy
      derbysoftOrderResponse = await this.derbysoftSupplierClient.bookReservation(
        context.supplierId,
        derbysoftOrderRequest.params,
        derbysoftOrderRequest.bookingToken,
        this.usePciProxy // we might need to get this from some config value
      );

      // save the order as in progress to prevent double booking
      await this.ordersStorageService.saveOrderInProgress(orderId, orderRecord);
    } catch (error) {
      // check error to determine status of order

      // For Derbysoft Errors
      if (error instanceof DerbysoftError) {
        // if derbysoft system error, move order to ghost job queue - orders with indeterminate state
        if (error.isSystemError) {
          // save the order as in progress to prevent double booking since we are not sure of state of order from derbysoft
          await this.ordersStorageService.saveOrderInProgress(orderId, orderRecord);

          // add to ghost bookings
          await this.ghostBookingsService.addGhostBooking(
            orderId,
            pricingMetadata,
            (error as Error).message,
            context.supplierId,
            contactEmail
          );
        }
        // if a user error return appropriate error message
        throw error;
      }
      // For unknown errors set order as failed
      else {
        // save failed order
        await this.ordersStorageService.createFailedOrder(orderId, orderRecord);
        throw error;
      }
    }

    let travelComponent: SMDTravelComponentHotel;
    try {
      // create travelComponent on SimardPay
      const reservationNumber = derbysoftOrderResponse.reservationIds.supplierResId;
      travelComponent = extractTravelComponentFromPricingMetaData(
        pricingMetadata,
        reservationNumber,
        coerceArray(contactEmail)
      );

      const success = await this.simardClient.createTokenComponents(guaranteeId, [travelComponent]);
      if (!success) {
        this.log.error("Unknown Error: TravelComponent creation on SimardPay failed");
        throw new HotelOTAError("Unknown Error: TravelComponent creation on SimardPay failed");
      }
    } catch (error) {
      // error creating travelComponent on SimardPay fail silently and log
      this.log.error(
        `Error: TravelComponent creation on SimardPay failed - "${(error as Error).message}"`,
        { guaranteeId, travelComponent }
      );
    }

    // convert received derbysoft booking response to WT specs
    const createOrderResponse = await this.derbysoftOrderConverter.DerbysoftToWtResponse(
      context,
      derbysoftOrderRequest,
      derbysoftOrderResponse,
      orderId,
      pricingMetadata,
      "CONFIRMED"
    );

    // save order confirmation
    await this.ordersStorageService.confirmOrder(
      orderId,
      createOrderResponse.order,
      createOrderResponse["providerDetails"] as OrderProviderDetails
    );

    delete createOrderResponse.providerDetails;

    return createOrderResponse;
  }

  public async retrieveOrderByOrderID(
    context: SessionContext,
    orderId: string
  ): Promise<CreateWithOfferResponse> {
    // get the order from DB by Id
    const orderFromDB = await this.ordersStorageService.findOrderByOrderId(orderId, {
      orgID: context.clientOrgId,
    });

    if (!orderFromDB) {
      throw new HotelOTAError(`Order with ID: ${orderId} was not found`, 404);
    }

    return this.retrieveOrder(orderFromDB, context);
  }

  public async retrieveOrderByOfferID(
    context: SessionContext,
    offerId: string
  ): Promise<CreateWithOfferResponse> {
    // get the order from DB by Id
    const orderFromDB = await this.ordersStorageService.findOrderByOfferId(offerId, {
      orgID: context.clientOrgId,
    });

    if (!orderFromDB) {
      throw new HotelOTAError(`Order with offerId: ${offerId} was not found`, 404);
    }

    return this.retrieveOrder(orderFromDB, context);
  }

  public async cancelOrderByOrderID(
    context: SessionContext,
    orderId: string
  ): Promise<OrderCancellationResponse> {
    // get the order from DB by Id
    const orderFromDB = await this.ordersStorageService.findOrderByOrderId(orderId, {
      orgID: context.clientOrgId,
    });

    if (!orderFromDB) {
      throw new HotelOTAError(`Order with ID: ${orderId} was not found`, 404);
    }

    // TO-DO: check orderStatus / cancellation policies before cancelling

    // cancel derbysoft order
    const reservationIds = orderFromDB.providerDetails.orderID as ReservationIds;
    const cancelResponse = await this.derbysoftSupplierClient.cancelReservation(
      context.supplierId,
      reservationIds
    );

    // update the status of the order in DB to cancelled
    if (cancelResponse.cancellationId) {
      // get cancellationId from supplier and store
      const cancellationId = cancelResponse.cancellationId;

      await this.ordersStorageService.cancelOrder(orderId, cancellationId, {
        orgID: context.clientOrgId,
      });
    }

    return {
      orderId: orderId,
      status: "CANCELLED",
      rawResponse: cancelResponse,
    };
  }

  private async retrieveOrder(
    orderFromDB: EOrder,
    context: SessionContext
  ): Promise<CreateWithOfferResponse> {
    // check if order failed before getting response/supplierReservationId from derbysoft
    if (this.orderProcessingFailed(orderFromDB)) {
      // return only order id and failed status
      return {
        orderId: orderFromDB.orderID,
        order: {
          status: OrderProcessingStage.CREATION_FAILED,
          supplierReservationId: null,
        },
      };
    }

    // get order details from Derbysoft
    let derbysoftOrderResponse: BookingUsbQueryReservationDetailResponse;

    // if the order completed processing then get details from derbysoft
    if (orderFromDB.processingStage === "COMPLETED") {
      try {
        derbysoftOrderResponse = await this.retrieveOrderFromSupplier(context.supplierId, {
          orderId: orderFromDB.orderID,
          supplierReservationId: (orderFromDB.providerDetails.orderID as ReservationIds)
            .supplierResId,
        });
      } catch (error) {
        // fail silently - we should log this error
      }

      let orderResponse: CreateWithOfferResponse;
      // get current status of reservation from derbysoft and update DB record accordingly
      if (derbysoftOrderResponse) {
        orderResponse = await this.derbysoftRetrieveOrderConverter.DerbysoftToWtResponse(
          context,
          {},
          derbysoftOrderResponse,
          orderFromDB
        );
      } else {
        // if for some reason we don't get reservation details from derbysoft, we return our local cached details
        orderResponse = {
          order: orderFromDB.confirmation,
          orderId: orderFromDB.orderID,
        };
      }

      // if order status has changed update DB order record
      if (
        orderFromDB.confirmation &&
        orderResponse.order.status !== orderFromDB.confirmation.status
      ) {
        await this.ordersStorageService.updateOrderStatus(
          orderFromDB.orderID,
          orderResponse.order.status
        );
      }

      return orderResponse;
    } else {
      // something else happened and order processing didn't complete
      let status: OrderStatus;
      if (orderFromDB.processingStage === OrderProcessingStage.NOT_FOUND) {
        status = "CREATION_FAILED";
      } else {
        status = orderFromDB.processingStage;
      }
      return {
        order: {
          status,
          supplierReservationId: null,
        },
        orderId: orderFromDB.orderID,
      };
    }
  }

  public async retrieveOrderFromSupplier(
    supplierId: TSupplierId,
    { orderId, supplierReservationId }: { orderId: string; supplierReservationId?: string }
  ) {
    return this.derbysoftSupplierClient.queryReservationDetail(supplierId, {
      distributorResId: orderId,
      supplierResId: supplierReservationId,
    });
  }

  public async confirmPendingOrder(
    orderId: string,
    derbysoftOrderResponse: BookingUsbQueryReservationDetailResponse,
    pricingMetadata: DerbysoftPricingMetadata,
    contactEmail: string
  ) {
    // get order from DB
    const orderFromDB = await this.ordersStorageService.findOrderByOrderId(orderId);
    const guaranteeId = orderFromDB.guaranteeID;

    // create session context
    const supplierId = derbysoftOrderResponse.header.supplierId;
    const supplier = getSupplierById(this.suppliers, supplierId);
    const context: SessionContext = {
      clientOrgId: orderFromDB.orgID,
      supplierId: supplierId as TSupplierId,
      supplierOrgId: supplier?.supplierOrgId,
    };

    // convert derbysoft order response to WT specs
    const orderResponse = await this.derbysoftRetrieveOrderConverter.DerbysoftToWtResponse(
      context,
      {},
      derbysoftOrderResponse,
      orderFromDB,
      pricingMetadata
    );

    // create travel component
    let travelComponent: SMDTravelComponentHotel;
    try {
      // create travelComponent on SimardPay
      const reservationNumber = derbysoftOrderResponse.reservations[0].reservationIds.supplierResId;
      travelComponent = extractTravelComponentFromPricingMetaData(
        pricingMetadata,
        reservationNumber,
        coerceArray(contactEmail)
      );

      const success = await this.simardClient.createTokenComponents(guaranteeId, [travelComponent]);
      if (!success) {
        this.log.error("Unknown Error: TravelComponent creation on SimardPay failed");
        throw new HotelOTAError("Unknown Error: TravelComponent creation on SimardPay failed");
      }
    } catch (error) {
      // error creating travelComponent on SimardPay fail silently and log
      this.log.error(
        `Error: TravelComponent creation on SimardPay failed - "${(error as Error).message}"`,
        { guaranteeId, travelComponent }
      );
    }

    // save the order confirmation
    await this.ordersStorageService.confirmOrder(
      orderId,
      orderResponse.order,
      orderResponse["providerDetails"] as OrderProviderDetails
    );
  }

  public async cancelPendingOrder(orderId: string, cancellationId?: string) {
    return this.ordersStorageService.cancelOrder(orderId, cancellationId);
  }

  public async failPendingOrder(orderId: string) {
    return this.ordersStorageService.updateOrderCreationFailed(orderId);
  }

  private async retrievePricingMetadata(
    pricedOfferId: string,
    context: SessionContext
  ): Promise<DerbysoftPricingMetadata> {
    let pricingMetadata: DerbysoftPricingMetadata;
    try {
      const pricingMetadataPlain =
        await this.offersMetadataService.findPricingMetadata<DerbysoftPricingMetadata>(
          "DERBYSOFT",
          context,
          pricedOfferId
        );

      pricingMetadata = plainToInstance(DerbysoftPricingMetadata, pricingMetadataPlain);
    } catch (error) {
      if ((error as Error).message.includes("Could not find offer")) {
        throw new HotelOTAError(`Offer Expired or Not Exists: ${(error as Error).message}`, 404);
      }

      throw error; // let someone else handle it
    }
    return pricingMetadata;
  }

  private async validateCardToken(
    token: SMDTokenDetails,
    pricingMetadata: DerbysoftPricingMetadata
  ): Promise<void> {
    const offer: PricedOffer = Object.values(pricingMetadata.pricedOffers)[0].offerPrice;

    // we may have tokenized card here or amex card token
    // in case of amex we will have amount field populated and here we need to validate if amount/currency are OK here
    if (token.amount) {
      const tokenAmount = parseFloat(token.amount);
      if (offer.price.public > tokenAmount) {
        throw new HotelOTAError(
          `Insufficient authorized amount ${tokenAmount} (minimum amount: ${offer.price.public})`,
          HttpStatusCode.CLIENT_BAD_REQUEST,
          [ErrorCodes.INSUFFICIENT_FUNDS]
        );
      }
      if (token.currency !== offer.price.currency) {
        throw new HotelOTAError(
          `Invalid payment currency ${token.currency} (actual currency: ${offer.price.currency})`,
          HttpStatusCode.CLIENT_BAD_REQUEST,
          [ErrorCodes.INSUFFICIENT_FUNDS]
        );
      }
    }
  }

  // this tests if an error occurred before we got a response from provider
  private orderProcessingFailed = (order: EOrder) => {
    return order.processingStage === "CREATION_FAILED";
  };
}
