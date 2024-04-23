import {Service} from 'typedi';
import {OrmRepository} from 'typeorm-typedi-extensions';
import {FindOneOptions} from 'typeorm';
import {OrderRepository} from '../../database/repositories/OrderRepository';
import {EOrder} from '../../database/models/EOrder';
import {Order, OrderProcessingStage} from '../../interfaces/glider';
import {GuaranteeType} from '../bre/GuaranteeType';
import {BaseGliderException, ErrorCodes, HttpStatusCode} from '../../api/errors';
import { OrderProviderDetails } from '../../interfaces/glider/order/OrderProviderDetails';
import {LoggerFactory} from '../../lib/logger';

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
    tokenDetails?: any;
}

@Service()
export class OrdersStorageService {

    @OrmRepository()
    private orderRepository: OrderRepository;

    private log = LoggerFactory.createLogger('order service');

    /**
     * Find order by orderID.
     * If nothing was found it will return undefined
     *
     * @param orderID
     */
    public async findOrderByOrderId(orderID: string): Promise<EOrder> {
        const query: FindOneOptions<EOrder> = {
            where: {
                orderID,
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
    public async findOrderByOfferId(offerID: string): Promise<EOrder> {
        const query: FindOneOptions<EOrder> = {
            where: {
                offerID,
            },
        };
        return await this.orderRepository.findOne(query);
    }

    public async saveOrderInProgress(offerID: string, params: EOrderUpdateOptions): Promise<EOrder> {
        const record: EOrder = new EOrder();
        this.populateParametersToEntity(record, params);    // copy additional params
        record.orderID = offerID;
        record.creationDate = new Date();
        record.processingStage = OrderProcessingStage.IN_PROGRESS;
        this.log.debug('saveOrderInProgress:' + record.toString());
        return await this.orderRepository.save(record);
    }

    public async saveOrder(order: EOrder): Promise<EOrder> {
        this.log.debug('store order:' + order.toString());
        return await this.orderRepository.save(order);
    }

    public async updateOrderDetails(orderID: string, params: EOrderUpdateOptions): Promise<EOrder> {
        this.log.debug(`update order data, orderID:${orderID}`);
        const record = await this.findOrderByOrderId(orderID);
        if (!record) {
            this.log.error(`Order not found, cannot update details, orderID:${orderID}`);
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, 'Order not found', ErrorCodes.ORDER_NOT_FOUND);
        }
        this.populateParametersToEntity(record, params);
        return await this.orderRepository.save(record);
    }
    private populateParametersToEntity(record: EOrder, params: EOrderUpdateOptions): EOrder {
        if (params.orderID) {
            record.orderID = params.orderID;
        }
        if (params.offerID) {
            record.offerID = params.offerID;
        }
        if (params.orgID) {
            record.orgID = params.orderID;
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
        if (params.tokenDetails) {
            record.tokenDetails = params.tokenDetails;
        }
        return record;
    }
}
