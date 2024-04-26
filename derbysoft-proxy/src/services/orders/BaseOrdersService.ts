import Container, { Service } from "typedi";
import {
  CreateWithOfferResponse,
  OrderCancellationResponse,
  PassengerBooking,
} from "@windingtree/glider-types/dist/accommodations";

// TO-DO: Pull this from wt-utils package
import { OrdersStorageService } from "./OrdersStorageService";
import { EnforceSessionContext } from "../../types/shared/SessionContext";
import { SessionContext } from "../../types/shared/SessionContext";

@Service()
export abstract class BaseOrdersService implements EnforceSessionContext<BaseOrdersService> {
  protected get ordersStorageService(): OrdersStorageService {
    // TO-DO: hacky workaround as property injection errors out
    return Container.get(OrdersStorageService);
  }

  public abstract createOrderWithOfferID(
    context: SessionContext,
    pricedOfferId: string,
    guaranteeId: string,
    passengers: { [k: string]: PassengerBooking },
    remarks?: string[]
  ): Promise<CreateWithOfferResponse>;

  public abstract retrieveOrderByOrderID(
    context: SessionContext,
    orderId: string
  ): Promise<CreateWithOfferResponse>;

  public abstract cancelOrderByOrderID(
    context: SessionContext,
    orderId: string
  ): Promise<OrderCancellationResponse>;

  public abstract retrieveOrderByOfferID(
    context: SessionContext,
    offerId: string
  ): Promise<CreateWithOfferResponse>;

  // providerId: predefined constant identifier for hotel aggregator
  constructor(protected providerId: string) {}
}
