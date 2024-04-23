import {IsNotEmpty, IsString} from 'class-validator';
import {Order} from './Order';
import {Exclude, Type} from 'class-transformer';
import { OrderSyncStatus } from './OrderSyncStatua';
import { OrderProviderDetails } from './OrderProviderDetails';

export interface BaseOrderResponseConstructorParameters {
    orderId: string;
    order: Order;
    syncStatus?: OrderSyncStatus;
}

export class BaseOrderResponse  {
    @IsNotEmpty()
    @IsString()
    public orderId: string;

    @IsNotEmpty()
    @Type(() => Order)
    public order: Order;

    public syncStatus?: OrderSyncStatus;
    public providerDetails: OrderProviderDetails;

    @Exclude()
    public tokenDetails?: any;

    constructor(params?: BaseOrderResponseConstructorParameters) {
        if (params) {
            const {orderId, order, syncStatus} = params;
            this.orderId = orderId;
            this.order = order;
            this.syncStatus = syncStatus;
        }
    }

}
