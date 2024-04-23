import { BaseOrderResponse } from './BaseOrderResponse';
import {SMDGuaranteeDetails, SMDTokenDetails} from '../../simard';

export class CreateOrderResponse extends BaseOrderResponse {
    public tokenDetails?: SMDGuaranteeDetails|SMDTokenDetails;
}
