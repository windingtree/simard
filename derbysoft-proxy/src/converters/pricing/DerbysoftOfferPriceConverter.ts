import { BaseWTDerbysoftConverter } from "../interfaces/BaseWTDerbysoftConverter";
import Container, { Service } from "typedi";
import { Guest, ReservationIds } from "@simardwt/derbysoft-types";

import { DerbysoftToWTOfferPriceResponseBuilder } from "./DerbysoftToWTOfferPriceResponseBuilder";
import {
  DerbysoftOfferPriceRequest,
  DerbysoftOfferPriceResponse,
  WTOfferPriceRequest,
} from "../../types/api/DerbysoftOfferPricing";
import { OffersMetadataService } from "../../services/offers/OffersMetadataService";
import { DerbysoftSearchMetadata } from "../../types/api/DerbysoftSearchMetadata";
import { plainToInstance } from "class-transformer";
import { PricedOfferResponse } from "@windingtree/glider-types/dist/accommodations";
import { HotelOTAError } from "../../types";
import { SessionContext } from "../../types/shared/SessionContext";

@Service()
export class DerbysoftOfferPriceConverter extends BaseWTDerbysoftConverter<
  WTOfferPriceRequest,
  PricedOfferResponse,
  DerbysoftOfferPriceRequest,
  DerbysoftOfferPriceResponse
> {
  private get offersMetadataService(): OffersMetadataService {
    return Container.get(OffersMetadataService);
  }

  public async WtToDerbysoftRequest(
    context: SessionContext,
    wtRequest: WTOfferPriceRequest
  ): Promise<DerbysoftOfferPriceRequest> {
    // TO-DO: How do we get other resId properties for supplierResId and derbyResId

    // fetch metadata for the specified offerId but we pick only the first
    // bcos derbysoft only allows booking multiple rooms but with single room rate
    const offerId = wtRequest.offerIDs[0];

    // generate internal reservationIds
    const reservationIds = new ReservationIds();
    reservationIds.distributorResId = offerId;

    let offerMetadata: DerbysoftSearchMetadata;
    try {
      const offerMetadataPlain =
        await this.offersMetadataService.findShoppingMetadata<DerbysoftSearchMetadata>(
          "DERBYSOFT",
          context,
          offerId
        );

      offerMetadata = plainToInstance(DerbysoftSearchMetadata, offerMetadataPlain);
    } catch (error) {
      if ((error as Error).message.includes("Could not find offer")) {
        throw new HotelOTAError((error as Error).message, 404);
      }

      throw error; // let someone else handle it
    }

    // get the offer metadata
    const { roomCriteria, stayRange, loyaltyAccount } = offerMetadata.searchCriteria;
    const { hotelId, roomRate, totalAmount } = offerMetadata.getOffer(offerId);

    // create dummy guest to be used as contactPerson
    const contactPerson = new Guest("John", "Doe");

    return new DerbysoftOfferPriceRequest(
      reservationIds,
      hotelId,
      stayRange,
      contactPerson,
      roomCriteria,
      totalAmount,
      [roomRate],
      [contactPerson],
      loyaltyAccount
    );
  }

  public async DerbysoftToWtResponse(
    context: SessionContext,
    derbysoftRequest: DerbysoftOfferPriceRequest,
    derbysoftResponse: DerbysoftOfferPriceResponse,
    // extra arguments to build metadata
    offerId: string
  ): Promise<PricedOfferResponse> {
    const { reservationIds } = derbysoftRequest;

    const responseBuilder = new DerbysoftToWTOfferPriceResponseBuilder(
      context,
      derbysoftResponse,
      this.offersMetadataService,
      offerId,
      reservationIds
    );

    const result = await responseBuilder.build();
    result.rawResponse = derbysoftResponse;
    return result;
  }
}
