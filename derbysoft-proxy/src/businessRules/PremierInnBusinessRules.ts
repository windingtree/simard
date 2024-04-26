import { CreateOfferRequest } from "@windingtree/glider-types/dist/accommodations";
import { DerbysoftOrderRequest } from "../types";
import { DefaultBusinessRules } from "./DefaultBusinessRules";
import { RoomTypeFilter } from "../services/derbysoft/DerbysoftUtils";

export class PremierInnBusinessRules extends DefaultBusinessRules {
  public processOrderRequest(
    originalCreateOfferRequest: CreateOfferRequest,
    preprocessedCreateOfferRequest: DerbysoftOrderRequest
  ): DerbysoftOrderRequest {
    // apply addresses
    const passengersArray = Object.values(originalCreateOfferRequest.passengers);
    this.processPassengersAddresses(
      passengersArray,
      preprocessedCreateOfferRequest.params,
      this.supplierId
    );

    return preprocessedCreateOfferRequest;
  }

  // At the moment Premier Inn has room products with no matching content
  // internally, room types in DB are an "outer join" of rooms with and without content
  // we use this field to exclude rooms that have content but no matching product
  // in client responses
  public roomTypesFilter: RoomTypeFilter[] = ["hasNoProduct"];
}
