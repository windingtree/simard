import { OrderRetrievalResponse } from '../../interfaces/glider/order/OrderRetrievalResponse';
import { BaseOrderResultsBuilder } from './BaseOrderResultsBuilder';
import {ExtendedSessionContext} from '../../services/ExtendedSessionContext';

export class OrderRetrievalResultsBuilder extends BaseOrderResultsBuilder {
  public build(sessionContext: ExtendedSessionContext): OrderRetrievalResponse {
    const results = super.build(sessionContext);
    return results;
  }
}
