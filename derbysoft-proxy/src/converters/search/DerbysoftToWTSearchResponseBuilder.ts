import { generateUUID, getLogger } from "@simardwt/winding-tree-utils";
import { AvailableHotel } from "@simardwt/derbysoft-types";
import { EDerbysoftHotel } from "../../database/models/EDerbysoftHotel";
import { DerbysoftHotelsService } from "../../services/derbysoft/DerbysoftHotelsService";
import {
  DerbysoftSearchRequest,
  DerbysoftSearchResponse,
} from "../../types/api/DerbysoftOffersSearch";
import {
  DerbysoftOffersMetadata,
  DerbysoftSearchMetadata,
} from "../../types/api/DerbysoftSearchMetadata";
import { EDerbysoftRoomTypeCustomData } from "../../types/database/EDerbysoftRoomTypeCustomData";
import {
  SearchResponse,
  Offer,
  Accommodation,
  AdditionalPricePlanProperties,
  RefundabilityPolicy,
} from "@windingtree/glider-types/dist/accommodations";
import { encodeAccommodationId, encodeRoomTypeId } from "../../utils/accommodation";
import { computePriceAndTaxes } from "../common/priceCalculator";
import { computeFirstNightPrice, toRefundabilityPolicy } from "../common/refundability";
import { SessionContext } from "../../types/shared/SessionContext";
import {
  RoomTypeMap,
  buildAccommodation,
  getRoomTypePlan,
} from "../../services/derbysoft/DerbysoftUtils";
import { BusinessRulesFactory } from "../../businessRules/BusinessRulesFactory";

const log = getLogger(__filename, {
  topic: "DerbysoftToWTSearchResponseBuilder",
});

export class DerbysoftToWTSearchResponseBuilder {
  constructor(
    private context: SessionContext,
    private derbysoftSearchRequest: DerbysoftSearchRequest,
    private _derbysoftSearchResponse: DerbysoftSearchResponse,
    private derbysoftHotelsService: DerbysoftHotelsService
  ) {}

  public get derbysoftSearchResponse(): DerbysoftSearchResponse {
    return this._derbysoftSearchResponse;
  }

  public async build(): Promise<SearchResponse> {
    const accommodations = new Map<string, Accommodation>();
    const offers = new Map<string, Offer>();
    const offersMetadata = new DerbysoftSearchMetadata();

    // build array of hotelIds in response
    const { availHotels, header } = this.derbysoftSearchResponse;
    const hotelIds = availHotels.map((hotel: AvailableHotel) => hotel.hotelId);

    // fetch hotels info from DB
    const hotelsArray = await this.derbysoftHotelsService.findHotelsByIds(hotelIds, this.context);

    // map hotels info for faster access
    const hotelsInfo = new Map<string, EDerbysoftHotel>();

    hotelsArray.forEach((hotel) => {
      const key = hotel.customData.supplierId + hotel.providerHotelId;
      hotelsInfo.set(key, hotel);
    });

    availHotels.forEach((hotel: AvailableHotel) => {
      // build accommodations - from availHotels i.e just the hotels without the rates

      // create key and get hotel info from hotelsInfo map
      const hotelId = hotel.hotelId;
      const hotelKey = hotel.supplierId + hotelId;
      const hotelInfo = hotelsInfo.get(hotelKey);

      // get room types filter
      const roomTypesFilter = BusinessRulesFactory.getBusinessRules(
        this.context.supplierId
      ).roomTypesFilter;

      const roomTypesRef = new Map<string, RoomTypeMap>();
      const accommodation = buildAccommodation(hotelInfo, roomTypesRef, false, roomTypesFilter);

      const accommodationId = encodeAccommodationId(
        { hotelId, supplierId: hotel.supplierId },
        "DS"
      );

      // build offers - from availRoomRates
      const { availRoomRates } = hotel;

      // If at least one room rate exists for the recommendation (not always the case), create an offer.
      let nbOffers = 0;
      for (const roomRate of availRoomRates) {
        try {
          // for live availability checks, roomCriteria is property on hotel object
          // set roomCriteria if not found
          if (!roomRate.roomCriteria) roomRate.roomCriteria = hotel.roomCriteria;

          const { price, totalAmountAfterTax, totalAmountBeforeTax } = computePriceAndTaxes(
            roomRate,
            roomRate.roomCriteria
          );

          const expiration = new Date(new Date().getTime() + 30 * 60 * 1000);

          const pricePlanRef = new Map<string, AdditionalPricePlanProperties>();
          const encodedRoomTypeId = encodeRoomTypeId(hotelId, roomRate.roomId);

          const roomType = roomTypesRef.get(encodedRoomTypeId);
          if (!roomType) {
            // Sometimes it is not returned, and I'm not sure why, so let's log it when it happens
            // EDIT: It seems hotel products gotten from query for hotel products during sync, sometimes does not reflect all
            // available products. Unlisted products are sometimes present during an availability search
            // On further enquiry Derbysoft says this is a possible side effect from suppliers. So roomType lookup isn't always guaranteed
            log.warn(
              `roomType undefined for hotelId: ${hotelId}, roomId: ${roomRate.roomId} and rateId: ${roomRate.rateId}`
            );
          }

          const roomTypeId = roomType?.roomTypeId;
          const customData = roomType?.eRoomType.customData as EDerbysoftRoomTypeCustomData;

          const roomTypePlan = getRoomTypePlan(roomRate, customData);
          pricePlanRef.set(accommodationId, {
            accommodation: accommodationId,
            roomTypePlan,
            // some suppliers do not return product details (e.g MARRIOTT) so this field is undefined
            roomType: roomTypeId,
          });

          const nightPrice = computeFirstNightPrice(roomRate, roomRate.roomCriteria.roomCount);
          const refundability: RefundabilityPolicy = toRefundabilityPolicy(
            roomRate.cancelPolicy,
            hotel.stayRange.checkin,
            nightPrice,
            price.public,
            roomRate.currency,
            hotelInfo.customData.timezone
          );

          const offer: Offer = {
            expiration: expiration.toJSON(),
            price,
            pricePlansReferences: Object.fromEntries(pricePlanRef),
            refundability,
          };

          nbOffers++;
          const offerId = generateUUID();
          offers.set(offerId, offer);

          // build offer metadata for lookup (these are stored afterwards in db)
          const metadata: DerbysoftOffersMetadata = {
            hotelId,
            roomRate,
            totalAmount: {
              amountBeforeTax: Number(totalAmountBeforeTax),
              amountAfterTax: Number(totalAmountAfterTax),
            },
            taxes: Number(offer.price.taxes),
            currency: offer.price.currency,
            roomTypePlan,
            roomTypeId,
            refundability,
          };

          offersMetadata.offers.set(offerId, metadata);
        } catch (error) {
          log.warn(`Error building offer from roomRate: ${(error as Error).message}`, {
            roomRate: JSON.stringify(roomRate),
          });

          continue;
        }
      }

      if (nbOffers > 0) {
        accommodations.set(accommodationId, accommodation);
      }

      // TO-DO: build price plans - build this dynamically
    });

    // append initial search criteria to metadata
    if (this.derbysoftSearchRequest.loyaltyAccount) {
      this.derbysoftSearchRequest.loyaltyAccount;
    }

    offersMetadata.searchCriteria = {
      roomCriteria: this.derbysoftSearchRequest.roomCriteria,
      stayRange: this.derbysoftSearchRequest.stayRange,
      loyaltyAccount: this.derbysoftSearchRequest.loyaltyAccount,
    };

    offersMetadata.header = header;

    const result: SearchResponse = {
      offers: Object.fromEntries(offers),
      accommodations: Object.fromEntries(accommodations),
      searchMetadata: offersMetadata,
    };

    return result;
  }
}
