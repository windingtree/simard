import { CreateOrderResponse } from '../../interfaces/glider';
import { BaseOrderResultsBuilder } from './BaseOrderResultsBuilder';
import {ExtendedSessionContext} from '../../services/ExtendedSessionContext';

export class OrderCreateResultsBuilder extends BaseOrderResultsBuilder {
  public build(sessionContext: ExtendedSessionContext): CreateOrderResponse {
    const results = super.build(sessionContext);
    return results;
  }
}
