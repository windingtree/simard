import { BaseWTDerbysoftConverter } from "../interfaces/BaseWTDerbysoftConverter";
import { Service } from "typedi";
import {
  CardPayment,
  Guest,
  GuestType,
  PreBookReservationParams,
  ReservationIds,
} from "@simardwt/derbysoft-types";
import { DerbysoftOrderRequest, DerbysoftOrderResponse } from "../../types/api/DerbysoftOrder";
import {
  DerbysoftOfferPriceMetadata,
  DerbysoftPricingMetadata,
} from "../../types/api/DerbysoftOfferPricingMetadata";
import { guestToContactPerson, WTPassengerToDerbySoftGuest } from "../common/passengersConverter";
import { DerbySoftToWTOrderResponseBuilder } from "./DerbySoftToWTOrderResponseBuilder";
import {
  CreateOfferRequest,
  CreateWithOfferResponse,
  OrderStatus,
} from "@windingtree/glider-types/dist/accommodations";
import { SessionContext } from "../../types/shared/SessionContext";
import { BusinessRulesFactory } from "../../businessRules/BusinessRulesFactory";
import { HotelOTAError, PricingMetadata } from "../../types";
import { getLogger } from "@simardwt/winding-tree-utils";

@Service()
export class DerbysoftOrderConverter extends BaseWTDerbysoftConverter<
  CreateOfferRequest,
  CreateWithOfferResponse,
  DerbysoftOrderRequest,
  DerbysoftOrderResponse
> {
  private log = getLogger(__filename);
  public async WtToDerbysoftRequest(
    context: SessionContext,
    wtRequest: CreateOfferRequest,
    payment: CardPayment,
    pricingMetadata: DerbysoftPricingMetadata,
    orderId: string,
    remarks?: string[]
  ): Promise<DerbysoftOrderRequest> {
    // get the offer metadata
    const { bookingToken } = pricingMetadata;
    // ensure pricedOffer has not expired
    this.assertOfferPriceNotExpired(pricingMetadata);

    // build passenger list
    const guests = Object.values(wtRequest.passengers).map((passenger, idx) => {
      return WTPassengerToDerbySoftGuest(passenger, idx);
    });

    // ensure passenger list matches initial offer search passenger criteria
    this.confirmPassengerCount(guests, pricingMetadata);

    // build params
    const reservationIds = new ReservationIds();
    reservationIds.distributorResId = orderId;

    const { roomCriteria, stayRange, loyaltyAccount } = pricingMetadata.searchCriteria;

    // get first and only offer price
    const offerPriceMeta = Object.values(pricingMetadata.pricedOffers)[0];
    const { hotelId, totalAmount, roomRate } = offerPriceMeta;

    const params: PreBookReservationParams = {
      reservationIds,
      hotelId,
      stayRange,
      contactPerson: guestToContactPerson(guests[0]),
      roomCriteria,
      total: totalAmount,
      roomRates: [roomRate],
      guests,
      payment,
      loyaltyAccount,
      comments: remarks,
    };

    const derbysoftOrderRequest = new DerbysoftOrderRequest(params, bookingToken);

    // apply business rules
    const { guaranteeId, offerId, passengers } = wtRequest;
    const processedDerbysoftOrderRequest = BusinessRulesFactory.getBusinessRules(
      context.supplierId
    ).processOrderRequest({ guaranteeId, offerId, passengers }, derbysoftOrderRequest);

    return processedDerbysoftOrderRequest;
  }

  public async DerbysoftToWtResponse(
    context: SessionContext,
    derbySoftRequest: DerbysoftOrderRequest,
    derbysoftResponse: DerbysoftOrderResponse,
    // extra arguments to build metadata
    orderId: string,
    pricingMetadata: DerbysoftPricingMetadata,
    status: OrderStatus
  ): Promise<CreateWithOfferResponse> {
    const responseBuilder = new DerbySoftToWTOrderResponseBuilder(
      derbysoftResponse,
      orderId,
      pricingMetadata,
      context,
      status
    );

    const result = await responseBuilder.build();
    result.rawResponse = derbysoftResponse;
    return result;
  }

  private confirmPassengerCount(guests: Guest[], pricingMetadata: DerbysoftPricingMetadata) {
    const adultCount = guests.reduce((adults, guest) => {
      if (guest.type === GuestType.Adult) {
        adults += 1;
      }

      return adults;
    }, 0);

    const childCount = guests.reduce((children, guest) => {
      if ([GuestType.Child, GuestType.Infant].includes(guest.type)) {
        children += 1;
      }

      return children;
    }, 0);

    const offerAdultCount = pricingMetadata.searchCriteria?.roomCriteria.adultCount;
    const offerChildCount = pricingMetadata.searchCriteria?.roomCriteria.childCount;
    if (adultCount !== offerAdultCount || childCount !== offerChildCount) {
      const errorMessage = `Passengers/guests mismatch: Passenger count in 'create order' - (Adult: ${adultCount}, Children: ${childCount}), 'offer search' - (Adult: ${offerAdultCount}, Children: ${offerChildCount})`;
      this.log.error(errorMessage);
      throw new HotelOTAError(errorMessage, 400);
    }
  }

  private assertOfferPriceNotExpired = (pricingMetadata: PricingMetadata) => {
    if (!pricingMetadata) {
      throw new HotelOTAError(`The priced offer was not found or has expired`);
    }

    const { pricedOffers } = pricingMetadata;
    const pricedOffer = Object.values(pricedOffers)[0] as DerbysoftOfferPriceMetadata;

    if (new Date(pricedOffer.offerPrice.expiration) < new Date()) {
      throw new HotelOTAError(
        `The priced offer with ID, ${Object.keys(pricedOffers[0])} has expired`
      );
    }
  };
}
