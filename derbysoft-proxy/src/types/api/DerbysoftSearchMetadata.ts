import {
  Amount,
  LoyaltyAccount,
  RoomCriteria,
  RoomRate,
  ShoppingHeader,
  StayRange,
} from "@simardwt/derbysoft-types";
import { HotelOTAError } from "../shared";
import { SearchMetadata } from "./DerbysoftOffersSearch";
import { RefundabilityPolicy, RoomTypePlan } from "@windingtree/glider-types/dist/accommodations";

export interface DerbysoftOffersSearchCriteria {
  stayRange: StayRange;
  roomCriteria: RoomCriteria;
  loyaltyAccount?: LoyaltyAccount;
}

export interface DerbysoftOffersMetadata {
  roomRate: RoomRate;
  hotelId: string;
  totalAmount: Amount;
  currency: string;
  taxes?: number;
  roomTypeId: string;
  roomTypePlan: RoomTypePlan;
  refundability: RefundabilityPolicy;
}

export class DerbysoftSearchMetadata extends SearchMetadata {
  constructor(public searchCriteria?: DerbysoftOffersSearchCriteria) {
    super();
  }
  public header: ShoppingHeader;
  public offers: Map<string, DerbysoftOffersMetadata> = new Map<string, DerbysoftOffersMetadata>();

  public getOffer = (offerID: string): DerbysoftOffersMetadata => {
    const offerMeta = this.offers[offerID];
    if (!offerMeta) {
      throw new HotelOTAError(`Could not find offer ${offerID}`, 404);
    }

    return offerMeta;
  };
}
