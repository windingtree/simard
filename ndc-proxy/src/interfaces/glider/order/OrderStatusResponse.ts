import {IsEnum, IsNotEmpty} from 'class-validator';
import {Type} from 'class-transformer';
import {CreateOrderResponse} from './CreateOrderResponse';
import {OrderProcessingStage} from './OrderProcessingStage';

export class OrderStatusResponse {
    @IsNotEmpty()
    @IsEnum(OrderProcessingStage)
    public status: OrderProcessingStage;

    @Type(() => CreateOrderResponse)
    public confirmation: CreateOrderResponse;
}
