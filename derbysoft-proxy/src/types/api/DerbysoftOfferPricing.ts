// import { PricedOfferResponse } from "@simardwt/winding-tree-types";
import {
  RoomCriteria,
  StayRange,
  BookingUsbReservationPreBookResponse,
  PreBookReservationParams,
  Amount,
  Guest,
  ReservationIds,
  RoomRate,
  LoyaltyAccount,
} from "@simardwt/derbysoft-types";

export class DerbysoftOfferPriceRequest implements PreBookReservationParams {
  constructor(
    public reservationIds: ReservationIds,
    public hotelId: string,
    public stayRange: StayRange,
    public contactPerson: Guest,
    public roomCriteria: RoomCriteria,
    public total: Amount,
    public roomRates: RoomRate[],
    public guests?: Guest[],
    public loyaltyAccount?: LoyaltyAccount
  ) {}
}

export class DerbysoftOfferPriceResponse extends BookingUsbReservationPreBookResponse {}

export class WTOfferPriceRequest {
  public offerIDs: string[];
}

export abstract class PricingMetadata {
  public abstract pricedOffers: Map<string, unknown>;
}

// export class WTOfferPriceResponse extends PricedOfferResponse {
//   public rawResponse: unknown;
//   public offerPriceMetadata: PricingMetadata;
//   public toJSON() {
//     return {
//       offerId: this.offerId,
//       offer: this.offer,
//       rawResponse: this.rawResponse,
//     };
//   }
// }
