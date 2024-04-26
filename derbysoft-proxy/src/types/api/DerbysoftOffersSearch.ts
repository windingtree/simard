import {
  RoomCriteria,
  ShoppingExtensions,
  ShoppingUsbMultiHotelSearchResponse,
  StayRange,
  SupplierHotelDetail,
  MultiHotelSearchParamsForLiveCheck,
  LoyaltyAccount,
} from "@simardwt/derbysoft-types";
// import { mapToObj } from "../../utils/mapToObj";
// import { HotelOTAError } from "../shared";

export class DerbysoftSearchRequest implements MultiHotelSearchParamsForLiveCheck {
  constructor(
    public hotels: SupplierHotelDetail[],
    public stayRange: StayRange,
    public roomCriteria: RoomCriteria,
    public iata?: string,
    public extensions?: ShoppingExtensions
  ) {}

  public hotelId?: string;
  public loyaltyAccount?: LoyaltyAccount;
}

export class DerbysoftSearchRequestForLiveCheck extends DerbysoftSearchRequest {
  constructor(
    public hotels: SupplierHotelDetail[],
    public stayRange: StayRange,
    public roomCriteria: RoomCriteria,
    public iata?: string,
    public extensions?: ShoppingExtensions
  ) {
    super(hotels, stayRange, roomCriteria, iata, extensions);
  }

  public hotelId: string;
  public productCandidate: {
    roomId: string;
    rateId: string;
  };
}

export class DerbysoftSearchResponse extends ShoppingUsbMultiHotelSearchResponse {}

// export class ExtendedPassengerSearchCriteria extends PassengerSearchCriteria {
//   public childrenAges?: number[];

//   constructor(count?: number, type?: PassengerType, childrenAges?: number[]) {
//     if ([PassengerType.CHD, PassengerType.INF].includes(type)) {
//       if (!childrenAges?.length) {
//         throw new HotelOTAError(
//           "Invalid request: 'childrenAges' array not provided for child and/or infant"
//         );
//       }

//       if (childrenAges && childrenAges.length !== count) {
//         throw new HotelOTAError(
//           "Invalid request: number of children ages must equal the number of children"
//         );
//       }
//     }

//     super(count, type);
//     this.childrenAges = childrenAges;
//   }
// }

// export interface ExtendedAccommodationSearchCriteriaConstructorParameters {
//   arrival: Date;
//   departure: Date;
//   location: LocationInformation;
//   roomCount?: number;
// }

// export class ExtendedAccommodationSearchCriteria extends AccommodationSearchCriteria {
//   public roomCount?= 1;
//   constructor(
//     params: ExtendedAccommodationSearchCriteriaConstructorParameters
//   ) {
//     super(params);
//     this.roomCount = params.roomCount;
//   }
// }

// export class WTSearchRequest {
//   public accommodation: ExtendedAccommodationSearchCriteria;
//   public guests: ExtendedPassengerSearchCriteria[];
// }

export abstract class SearchMetadata {
  public abstract offers: Map<string, unknown>;
}

// export class WTSearchResponse extends SearchResults {
//   public rawResponse: unknown;
//   public searchMetadata: SearchMetadata;
//   public toJSON() {
//     return {
//       passengers: mapToObj(this.passengers),
//       offers: mapToObj(this.offers),
//       pricePlans: mapToObj(this.pricePlans),
//       accommodations: mapToObj(this.accommodations),
//       rawResponse: this.rawResponse,
//     };
//   }
// }
