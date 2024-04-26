import { BaseWTDerbysoftConverter } from "../interfaces/BaseWTDerbysoftConverter";
import { Service } from "typedi";
import { DerbysoftPricingMetadata, HotelOTAError } from "../../types";
import {
  DerbysoftOrderRequest,
  DerbysoftRetrieveOrderRequest,
  DerbysoftRetrieveOrderResponse,
} from "../../types/api/DerbysoftOrder";
import { DerbysoftToWTRetrieveOrderResponseBuilder } from "./DerbysoftToWTRetrieveOrderResponseBuilder";
import {
  CreateOfferRequest,
  CreateWithOfferResponse,
} from "@windingtree/glider-types/dist/accommodations";
import { SessionContext } from "../../types/shared/SessionContext";
import { EOrder } from "../../database/models/EOrder";

@Service()
export class DerbysoftRetrieveOrderConverter extends BaseWTDerbysoftConverter<
  CreateOfferRequest,
  CreateWithOfferResponse,
  DerbysoftOrderRequest,
  DerbysoftRetrieveOrderResponse
> {
  public async WtToDerbysoftRequest(): Promise<DerbysoftOrderRequest> {
    throw new HotelOTAError("WtToDerbysoftRequest not implemented");
  }

  public async DerbysoftToWtResponse(
    context: SessionContext,
    derbysoftRequest: DerbysoftRetrieveOrderRequest,
    derbysoftResponse: DerbysoftRetrieveOrderResponse,
    // extra arguments to build metadata
    order: EOrder,
    pricingMetadata?: DerbysoftPricingMetadata
  ): Promise<CreateWithOfferResponse> {
    const responseBuilder = new DerbysoftToWTRetrieveOrderResponseBuilder(
      derbysoftResponse,
      order,
      context,
      pricingMetadata
    );

    const result = await responseBuilder.build();
    result.rawResponse = derbysoftResponse;
    return result;
  }
}
