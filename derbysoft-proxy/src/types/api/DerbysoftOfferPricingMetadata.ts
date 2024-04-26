// import { PricedOffer } from "@simardwt/winding-tree-types";
import {
  LoyaltyAccount,
  ReservationHeader,
  ReservationIds,
  RoomCriteria,
  StayRange,
} from "@simardwt/derbysoft-types";
import { PricingMetadata } from "./DerbysoftOfferPricing";
import { OfferPriced } from "@windingtree/glider-types/dist/accommodations";
import { DerbysoftOffersMetadata } from "./DerbysoftSearchMetadata";

export interface DerbysoftOfferPriceCriteria {
  stayRange: StayRange;
  roomCriteria: RoomCriteria;
  loyaltyAccount?: LoyaltyAccount;
}

export interface DerbysoftOfferPriceMetadata extends DerbysoftOffersMetadata {
  offerPrice: OfferPriced;
}

export class DerbysoftPricingMetadata extends PricingMetadata {
  constructor(public searchCriteria?: DerbysoftOfferPriceCriteria) {
    super();
  }
  public offerId: string; // original offerId used to confirm price
  public header: ReservationHeader;
  public bookingToken: string;
  public reservationIds: ReservationIds;
  public pricedOffers: Map<string, DerbysoftOfferPriceMetadata> = new Map<
    string,
    DerbysoftOfferPriceMetadata
  >();
}
