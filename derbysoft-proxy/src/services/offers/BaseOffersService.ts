import Container, { Service } from "typedi";

// TO-DO: Pull this from wt-utils package
import { OffersStorageService } from "./OffersStorageService";
import {
  SearchResponse,
  PricedOfferResponse,
  SearchCriteria,
} from "@windingtree/glider-types/dist/accommodations";
import { EnforceSessionContext, SessionContext } from "../../types/shared/SessionContext";

@Service()
export abstract class BaseOffersService implements EnforceSessionContext<BaseOffersService> {
  protected get offersStorageService(): OffersStorageService {
    // TO-DO: hacky workaround as property injection errors out
    return Container.get(OffersStorageService);
  }

  public abstract searchForOffers(
    context: SessionContext,
    searchParams: SearchCriteria
  ): Promise<SearchResponse>;

  public abstract getPricedOffers(
    context: SessionContext,
    offerIDs: string[]
  ): Promise<PricedOfferResponse>;

  // providerId: predefined constant identifier for hotel aggregator
  constructor(protected providerId: string) {}
}
