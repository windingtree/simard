import {Body, Get, HeaderParam, JsonController, Param, Post} from 'routing-controllers';
import {OpenAPI, ResponseSchema} from 'routing-controllers-openapi';

import {CreateOrderRequest, CreateOrderResponse} from '../../../interfaces/glider';
import {OrdersService} from '../../../services/orders/OrdersService';
import {classToPlain} from 'class-transformer';
import {logMessage} from '../../../lib/logger';
import {OrderStatusResponse} from '../../../interfaces/glider';
import {BaseController} from '../common/BaseController';
import {JWTValidator} from '../../../lib/jwt';
import { OrderRetrievalResponse } from '../../../interfaces/glider/order/OrderRetrievalResponse';
import {logExecutionTime} from '../../../lib/utils/logExecutionTime';

@JsonController('/v1/orders')
@OpenAPI({security: [{basicAuth: []}]})
export class OrdersController extends BaseController {
    // private log = LoggerFactory.createLogger('order controller');
    constructor(
        private ordersService: OrdersService,
        jwtValidator: JWTValidator
    ) {
        super(jwtValidator);
    }

    @Post('/createWithOffer')
    @ResponseSchema(CreateOrderResponse)
    public async createWithOffer(@Body() request: CreateOrderRequest, @HeaderParam('authorization') bearerToken: string): Promise<CreateOrderResponse> {
        let response;
        await logExecutionTime('POST /orders/createWithOffer', async () => {
            // create shopping context
            await super.ensureUserIsAuthenticated(bearerToken);
            const context = await super.buildBaseSessionContext(bearerToken);
            await logMessage('Glider_createOrderRQ', JSON.stringify(classToPlain(request), undefined, 2), 'json');
            response = await this.ordersService.createWithOffer(context, request.offerId, request.guaranteeId, request.passengers);
            await logMessage('Glider_createOrderRS', JSON.stringify(classToPlain(response), undefined, 2), 'json');
        });
        return response;
    }

    @Get('/:offerID/status')
    @ResponseSchema(OrderStatusResponse)
    public async status(@HeaderParam('authorization') bearerToken: string, @Param('offerID') offerID: string): Promise<OrderStatusResponse> {
        let response;
        await logExecutionTime('GET /orders/offerID/status', async () => {
            await super.ensureUserIsAuthenticated(bearerToken);
            // create shopping context
            const context = await super.buildBaseSessionContext(bearerToken);

            await logMessage('Glider_orderStatusRQ', JSON.stringify(classToPlain({offerID}), undefined, 2), 'json');
            response = await this.ordersService.orderStatus(context, offerID);
            await logMessage('Glider_orderStatusRS', JSON.stringify(classToPlain(response), undefined, 2), 'json');
        });
        return response;
    }

    @Get('/:orderID')
    @ResponseSchema(OrderRetrievalResponse)
    public async retrieveOrder(@HeaderParam('authorization') bearerToken: string, @Param('orderID') orderID: string): Promise<OrderRetrievalResponse> {
        let response;
        await logExecutionTime('GET /orders/order', async () => {
            await super.ensureUserIsAuthenticated(bearerToken);
            // create shopping context
            const context = await super.buildBaseSessionContext(bearerToken);

            await logMessage('Glider_orderRetrievalRQ', JSON.stringify(classToPlain({orderID}), undefined, 2), 'json');
            response = await this.ordersService.retrieveOrderByOrderId(context, orderID);
            await logMessage('Glider_orderRetrievalRS', JSON.stringify(classToPlain(response), undefined, 2), 'json');
        });
        return response;
    }
}
