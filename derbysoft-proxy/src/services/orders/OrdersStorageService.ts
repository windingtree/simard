import { Service } from "typedi";
import { OrderProcessingStage, OrderProviderDetails } from "@simardwt/winding-tree-types";
import { FindOneOptions, MongoRepository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { ErrorCodes, GuaranteeType, HttpStatusCode, getLogger } from "@simardwt/winding-tree-utils";
import { HotelOTAError, KeyValuePairs } from "../../types";
import { Order, OrderStatus } from "@windingtree/glider-types/dist/accommodations";
import { EOrder } from "../../database/models/EOrder";

export interface EOrderUpdateOptions {
  orderID?: string;
  offerID?: string;
  processingStage?: OrderProcessingStage;
  guaranteeID?: string;
  guaranteeType?: GuaranteeType;
  confirmation?: Order;
  orgID?: string;
  providerID?: string;
  providerDetails?: OrderProviderDetails;
}

@Service()
export class OrdersStorageService {
  @InjectRepository(EOrder)
  private orderRepository: MongoRepository<EOrder>;
  private log = getLogger(__filename);

  /**
   * Find order by orderID.
   * If nothing was found it will return undefined
   *
   * @param orderID
   */
  public async findOrderByOrderId(
    orderID: string,
    filterCriteria: KeyValuePairs = {}
  ): Promise<EOrder> {
    const query: FindOneOptions<EOrder> = {
      where: {
        orderID,
        ...filterCriteria,
      },
    };
    return await this.orderRepository.findOne(query);
  }

  /**
   * Find order by offerID.
   * If nothing was found it will return undefined
   *
   * @param offerID
   */
  public async findOrderByOfferId(
    offerID: string,
    filterCriteria: KeyValuePairs = {}
  ): Promise<EOrder> {
    const query: FindOneOptions<EOrder> = {
      where: {
        offerID,
        ...filterCriteria,
      },
    };
    return await this.orderRepository.findOne(query);
  }

  public async saveOrderInProgress(orderID: string, params: EOrderUpdateOptions): Promise<EOrder> {
    const record: EOrder = new EOrder();
    this.populateParametersToEntity(record, params); // copy additional params
    record.orderID = orderID; // using OrderID here
    record.creationDate = new Date();
    record.processingStage = OrderProcessingStage.IN_PROGRESS;
    this.log.debug("saveOrderInProgress:" + JSON.stringify(record));
    return await this.orderRepository.save(record);
  }

  public async saveOrder(order: EOrder): Promise<EOrder> {
    this.log.debug("store order:" + order.toString());
    return await this.orderRepository.save(order);
  }

  public async updateOrderDetails(
    orderID: string,
    params: EOrderUpdateOptions,
    filterCriteria: KeyValuePairs = {}
  ): Promise<EOrder> {
    this.log.debug(`update order data, orderID:${orderID}`);
    const record = await this.findOrderByOrderId(orderID, filterCriteria);
    if (!record) {
      this.log.error(`Order not found, cannot update details, orderID:${orderID}`);
      throw new HotelOTAError("Order not found", HttpStatusCode.CLIENT_BAD_REQUEST, [
        ErrorCodes.ORDER_NOT_FOUND,
      ]);
    }
    this.populateParametersToEntity(record, params);
    return await this.orderRepository.save(record);
  }

  public async updateOrderStatus(
    orderID: string,
    status: OrderStatus,
    filterCriteria: KeyValuePairs = {}
  ): Promise<EOrder> {
    this.log.debug(`update order data, orderID:${orderID}`);
    const record = await this.findOrderByOrderId(orderID, filterCriteria);
    if (!record) {
      this.log.error(`Order not found, cannot update details, orderID:${orderID}`);
      throw new HotelOTAError("Order not found", HttpStatusCode.CLIENT_BAD_REQUEST, [
        ErrorCodes.ORDER_NOT_FOUND,
      ]);
    }

    // update record status
    record.confirmation.status = status;

    return await this.orderRepository.save(record);
  }

  public async updateOrderProcessingStage(
    orderID: string,
    status: OrderProcessingStage,
    filterCriteria: KeyValuePairs = {}
  ): Promise<EOrder> {
    this.log.debug(`update order data, orderID:${orderID}`);
    const record = await this.findOrderByOrderId(orderID, filterCriteria);
    if (!record) {
      this.log.error(`Order not found, cannot update details, orderID:${orderID}`);
      throw new HotelOTAError("Order not found", HttpStatusCode.CLIENT_BAD_REQUEST, [
        ErrorCodes.ORDER_NOT_FOUND,
      ]);
    }

    // update record status
    record.processingStage = status;

    return await this.orderRepository.save(record);
  }

  public async confirmOrder(
    orderID: string,
    order: Order,
    providerDetails: OrderProviderDetails,
    filterCriteria: KeyValuePairs = {}
  ): Promise<EOrder> {
    this.log.debug(`confirm order data, orderID:${orderID}`);
    const record = await this.findOrderByOrderId(orderID, filterCriteria);
    if (!record) {
      this.log.error(`Order not found, cannot confirm order, orderID:${orderID}`);
      throw new HotelOTAError("Order not found", HttpStatusCode.CLIENT_BAD_REQUEST, [
        ErrorCodes.ORDER_NOT_FOUND,
      ]);
    }

    // update record
    record.processingStage = OrderProcessingStage.COMPLETED;
    record.providerDetails = providerDetails;
    record.confirmation = order;

    return await this.orderRepository.save(record);
  }

  public async cancelOrder(
    orderID: string,
    cancellationId: unknown,
    filterCriteria: KeyValuePairs = {}
  ): Promise<EOrder> {
    this.log.debug(`confirm order data, orderID:${orderID}`);
    const record = await this.findOrderByOrderId(orderID, filterCriteria);
    if (!record) {
      this.log.error(`Order not found, cannot confirm order, orderID:${orderID}`);
      throw new HotelOTAError("Order not found", HttpStatusCode.CLIENT_BAD_REQUEST, [
        ErrorCodes.ORDER_NOT_FOUND,
      ]);
    }

    // update record
    record.providerDetails.cancellationID = cancellationId;
    record.confirmation.status = "CANCELLED";

    return await this.orderRepository.save(record);
  }

  public async updateOrderCreationFailed(
    orderID: string,
    filterCriteria: KeyValuePairs = {}
  ): Promise<EOrder> {
    return this.updateOrderProcessingStage(
      orderID,
      OrderProcessingStage.CREATION_FAILED,
      filterCriteria
    );
  }

  public async createFailedOrder(orderID: string, params: EOrderUpdateOptions): Promise<EOrder> {
    const record: EOrder = new EOrder();
    this.populateParametersToEntity(record, params); // copy additional params
    record.orderID = orderID; // using OrderID here
    record.creationDate = new Date();
    record.processingStage = OrderProcessingStage.CREATION_FAILED;
    this.log.debug("createFailedOrder:" + record.toString());
    return await this.orderRepository.save(record);
  }

  public async assertNoExistingOrder(pricedOfferId: string) {
    const orderDbRecord = await this.findOrderByOfferId(pricedOfferId);
    if (orderDbRecord) {
      if (orderDbRecord.processingStage === OrderProcessingStage.COMPLETED) {
        this.log.error(
          `Order for offer:${pricedOfferId} already exists, status: completed:${orderDbRecord.toString()}`
        );
        throw new HotelOTAError(
          `Order for this offerID already exists, status: completed (orderID: ${orderDbRecord.orderID}). Try to retrieve order`,
          HttpStatusCode.CLIENT_BAD_REQUEST,
          [ErrorCodes.ORDER_ALREADY_EXIST_OR_IN_PROGRESS]
        );
      } else if (orderDbRecord.processingStage === OrderProcessingStage.CREATION_FAILED) {
        this.log.error(
          `Order for offer:${pricedOfferId} already exists, status: failed:${orderDbRecord.toString()}`
        );
        throw new HotelOTAError(
          `Order for this offerID already exists, status: failed (orderID: ${orderDbRecord.orderID}). Try to retrieve order`,
          HttpStatusCode.CLIENT_BAD_REQUEST,
          [ErrorCodes.ORDER_ALREADY_EXIST_OR_IN_PROGRESS]
        );
      } else {
        this.log.error(
          `Order for offer:${pricedOfferId} already exists, status: in progress:${orderDbRecord.toString()}`
        );
        throw new HotelOTAError(
          `Order for this offerID was already exists, status: in progress (orderID: ${orderDbRecord.orderID}). Wait 60 seconds and try again`,
          HttpStatusCode.CLIENT_BAD_REQUEST,
          [ErrorCodes.ORDER_ALREADY_EXIST_OR_IN_PROGRESS]
        );
      }
    }
  }

  private populateParametersToEntity(record: EOrder, params: EOrderUpdateOptions): EOrder {
    if (params.orderID) {
      record.orderID = params.orderID;
    }
    if (params.offerID) {
      record.offerID = params.offerID;
    }
    if (params.orgID) {
      record.orgID = params.orgID;
    }
    if (params.processingStage) {
      record.processingStage = params.processingStage;
    }
    if (params.guaranteeType) {
      record.guaranteeType = params.guaranteeType;
    }
    if (params.guaranteeID) {
      record.guaranteeID = params.guaranteeID;
    }
    if (params.confirmation) {
      record.confirmation = params.confirmation;
    }
    if (params.providerID) {
      record.providerID = params.providerID;
    }
    if (params.providerDetails) {
      record.providerDetails = params.providerDetails;
    }
    return record;
  }
}
