import { OrderProviderDetails } from "@simardwt/winding-tree-types";
import { DerbysoftOrderResponse } from "../../types/api/DerbysoftOrder";
import {
  CreateWithOfferResponse,
  RoomTypes,
  OrderStatus,
} from "@windingtree/glider-types/dist/accommodations";
import {
  OrderWithDetails,
  buildAccommodation,
  getRoomTypeFromAccommodation,
  loyaltyAccountToLoyaltyProgram,
} from "../../services/derbysoft/DerbysoftUtils";
import { DerbysoftOfferPriceMetadata, DerbysoftPricingMetadata } from "../../types";
import { SessionContext } from "../../types/shared/SessionContext";
import { DerbysoftHotelsService } from "../../services/derbysoft/DerbysoftHotelsService";
import Container from "typedi";

export class DerbySoftToWTOrderResponseBuilder {
  constructor(
    private _derbysoftOrderResponse: DerbysoftOrderResponse,
    private orderId: string,
    private pricingMetadata: DerbysoftPricingMetadata,
    private context: SessionContext,
    private status: OrderStatus
  ) {}

  private get derbysoftHotelsService(): DerbysoftHotelsService {
    return Container.get<DerbysoftHotelsService>(DerbysoftHotelsService);
  }

  public get derbysoftOrderResponse(): DerbysoftOrderResponse {
    return this._derbysoftOrderResponse;
  }

  public async build(): Promise<CreateWithOfferResponse> {
    const order = await buildOrder(
      this.derbysoftOrderResponse.reservationIds.supplierResId,
      this.status,
      this.pricingMetadata,
      this.context,
      this.derbysoftHotelsService
    );

    // build order
    return {
      orderId: this.orderId,
      order,

      // sync status
      // syncStatus: OrderSyncStatus.REALTIME,

      providerDetails: new OrderProviderDetails(
        this.derbysoftOrderResponse.reservationIds,
        this.context.supplierId
      ),
    };
  }
}

export const buildOrder = async (
  supplierReservationId: string,
  status: OrderStatus,
  pricingMetadata: DerbysoftPricingMetadata,
  context: SessionContext,
  derbysoftHotelsService: DerbysoftHotelsService
): Promise<OrderWithDetails> => {
  const offerPriceMetadata = Object.values(
    pricingMetadata.pricedOffers
  )[0] as DerbysoftOfferPriceMetadata;

  // fetch hotel info
  const hotelId = offerPriceMetadata.hotelId;
  const hotelInfo = await derbysoftHotelsService.findHotelById(hotelId, context);
  const accommodation = buildAccommodation(hotelInfo, undefined, true);

  // get room rates from priceItems
  const roomRates = offerPriceMetadata.offerPrice.pricedItems;
  const price = offerPriceMetadata.offerPrice.price;

  // get nightCount from derbysoft-specific RoomRates
  const numberOfNights =
    offerPriceMetadata.roomRate.amountAfterTax?.length ??
    offerPriceMetadata.roomRate.amountBeforeTax?.length;

  // stay details
  const { roomCriteria, stayRange, loyaltyAccount } = pricingMetadata.searchCriteria;

  // get roomType from accommodation
  const { roomTypeId, roomTypePlan, refundability } = offerPriceMetadata;

  // some rooms from certain suppliers have no room type Id => content
  let roomType: RoomTypes;
  if (roomTypeId) {
    roomType = getRoomTypeFromAccommodation(accommodation, roomTypeId);

    // strip off media from roomType object
    roomType && delete roomType.media;
  }

  // strip off room types and media collection from accommodation object
  delete accommodation.roomTypes;
  delete accommodation.media;

  // get loyaltyPrograms as an array
  let loyaltyPrograms;
  if (loyaltyAccount) {
    loyaltyPrograms = [loyaltyAccountToLoyaltyProgram(loyaltyAccount)];
  }

  // TO-DO: handle restrictions from Cancel Policies

  return {
    accommodation,
    roomRates,
    loyaltyPrograms,
    price,
    stayDetails: {
      checkInDate: stayRange.checkin,
      checkOutDate: stayRange.checkout,
      numberOfNights,
      numberOfRooms: roomCriteria.roomCount,
      roomType,
      roomTypePlan,
      refundability,
    },
    supplierReservationId,
    status,
  };
};
