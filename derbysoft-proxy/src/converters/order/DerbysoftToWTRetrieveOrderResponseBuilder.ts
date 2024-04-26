import { DerbysoftRetrieveOrderResponse } from "../../types/api/DerbysoftOrder";
import { CreateWithOfferResponse, Order } from "@windingtree/glider-types/dist/accommodations";
import { EOrder } from "../../database/models/EOrder";
import { convertStatus } from "../common/statusConverter";
import { DerbysoftPricingMetadata } from "../../types";
import { buildOrder } from "./DerbySoftToWTOrderResponseBuilder";
import { DerbysoftHotelsService } from "../../services/derbysoft/DerbysoftHotelsService";
import Container from "typedi";
import { SessionContext } from "../../types/shared/SessionContext";

export class DerbysoftToWTRetrieveOrderResponseBuilder {
  constructor(
    private _derbysoftRetrieveOrderResponse: DerbysoftRetrieveOrderResponse,
    private orderInDB: EOrder,
    private context: SessionContext,
    private pricingMetadata?: DerbysoftPricingMetadata
  ) {}

  public get derbysoftRetrieveOrderResponse(): DerbysoftRetrieveOrderResponse {
    return this._derbysoftRetrieveOrderResponse;
  }

  private get derbysoftHotelsService(): DerbysoftHotelsService {
    return Container.get<DerbysoftHotelsService>(DerbysoftHotelsService);
  }

  public async build(): Promise<CreateWithOfferResponse> {
    const orderId = this.orderInDB.orderID;
    let order: Order;

    const status = convertStatus(this.derbysoftRetrieveOrderResponse);

    // if order already confirmed use DB cached values
    if (this.orderInDB.confirmation) {
      order = this.orderInDB.confirmation;
    }
    // else order has not been confirmed and we have pricing metadata, then build order object
    else if (!this.orderInDB.confirmation && this.pricingMetadata) {
      const reservation = this.derbysoftRetrieveOrderResponse.reservations[0];
      const supplierReservationId = reservation.reservationIds.supplierResId;

      order = await buildOrder(
        supplierReservationId,
        status,
        this.pricingMetadata,
        this.context,
        this.derbysoftHotelsService
      );
    }

    // convert derbysoft status to WT status
    order.status = status;

    const result = {
      order,
      orderId,
    };

    return result;
  }
}
