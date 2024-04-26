import { SearchCriteria } from "@windingtree/glider-types/dist/accommodations";
import { DerbysoftSearchRequest } from "../types";
import { DefaultBusinessRules } from "./DefaultBusinessRules";

export class MarriotBusinessRules extends DefaultBusinessRules {
  public processSearchRequest(
    originalSearchRequest: SearchCriteria,
    processedSearchRequest: DerbysoftSearchRequest
  ): DerbysoftSearchRequest {
    // apply Bonvoy number as loyalty account params

    // check original search for loyalty program fields
    const { loyaltyPrograms } = originalSearchRequest;
    this.processLoyaltyPrograms(loyaltyPrograms, processedSearchRequest);

    return processedSearchRequest;
  }
}
