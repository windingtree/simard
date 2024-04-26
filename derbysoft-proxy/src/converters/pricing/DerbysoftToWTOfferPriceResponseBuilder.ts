import { generateUUID } from "@simardwt/winding-tree-utils";
import { ReservationIds, RoomCriteria, RoomRate } from "@simardwt/derbysoft-types";
import { DerbysoftOfferPriceResponse } from "../../types/api/DerbysoftOfferPricing";
import { OffersMetadataService } from "../../services/offers/OffersMetadataService";
import {
  DerbysoftOfferPriceMetadata,
  DerbysoftPricingMetadata,
} from "../../types/api/DerbysoftOfferPricingMetadata";
import { DerbysoftSearchMetadata } from "../../types/api/DerbysoftSearchMetadata";
import { plainToInstance } from "class-transformer";
import { computePriceAndTaxes } from "../common/priceCalculator";
import {
  PricedOfferResponse,
  OfferPriced,
  PriceItem,
  FareItem,
  TaxItem,
} from "@windingtree/glider-types/dist/accommodations";
import { HotelOTAError } from "../../types";
import { SessionContext } from "../../types/shared/SessionContext";

export class DerbysoftToWTOfferPriceResponseBuilder {
  constructor(
    private context: SessionContext,
    private _derbysoftOfferPriceResponse: DerbysoftOfferPriceResponse,
    private offersMetadataService: OffersMetadataService,
    private offerId: string,
    private reservationIds: ReservationIds
  ) {}

  public get derbysoftOfferPriceResponse(): DerbysoftOfferPriceResponse {
    return this._derbysoftOfferPriceResponse;
  }

  public async build(): Promise<PricedOfferResponse> {
    const pricedOfferId = generateUUID();

    // get existing offer metadata to build pricedOffer
    const searchMetadataPlain =
      await this.offersMetadataService.findShoppingMetadata<DerbysoftSearchMetadata>(
        "DERBYSOFT",
        this.context,
        this.offerId
      );

    const searchMetadata = plainToInstance(DerbysoftSearchMetadata, searchMetadataPlain);

    // build pricedOffer
    const offerMeta = searchMetadata.getOffer(this.offerId);
    const pricedOffer = this.buildPricedOffer(
      offerMeta.roomRate,
      searchMetadata.searchCriteria.roomCriteria
    );

    const pricedOfferMeta: DerbysoftOfferPriceMetadata = {
      offerPrice: pricedOffer,
      ...offerMeta,
    };

    // build result
    const result: PricedOfferResponse = {
      offerId: pricedOfferId,
      offer: pricedOffer,
    };

    // map identifiers and save metadata
    const { bookingToken, header } = this.derbysoftOfferPriceResponse;

    const offerPriceMetadata = new DerbysoftPricingMetadata();
    offerPriceMetadata.offerId = this.offerId; // save original offerId from search
    offerPriceMetadata.searchCriteria = searchMetadata.searchCriteria;
    offerPriceMetadata.bookingToken = bookingToken;
    offerPriceMetadata.reservationIds = this.reservationIds;
    offerPriceMetadata.header = header;
    offerPriceMetadata.pricedOffers.set(pricedOfferId, pricedOfferMeta);

    result.offerPriceMetadata = offerPriceMetadata;

    return result;
  }

  private buildPricedOffer(roomRate: RoomRate, roomCriteria: RoomCriteria): OfferPriced {
    // get expirationDate
    // TO-DO: make this a config value
    // set to 30 minutes from now
    const expiration = new Date(new Date().getTime() + 30 * 60 * 1000);

    try {
      const { price, taxItems, fareItems } = computePriceAndTaxes(roomRate, roomCriteria);

      // build priced items
      const pricedItems = this.buildPricedItems(fareItems, taxItems);

      const pricedOffer: OfferPriced = {
        expiration: expiration.toJSON(),
        price,
        pricedItems,
        disclosures: [],
      };

      return pricedOffer;
    } catch (error) {
      throw new HotelOTAError("Issue retrieving the price");
    }
  }

  buildPricedItems(fareItems: FareItem[], taxItems: TaxItem[]): PriceItem[] {
    // this function may become useful when we deal with multiple priced items
    const pricedItems: PriceItem[] = [];
    const pricedItem: PriceItem = {
      fare: fareItems,
      taxes: taxItems,
    };

    pricedItems.push(pricedItem);
    return pricedItems;
  }

  // buildDisclosures(fees: FeeWithDate[], currency: string): string[][] {
  //   const disclosures = [];

  //   // build disclosures from fees/taxes
  //   const feeDisclosures = this.feeDisclosures(fees, currency);
  //   disclosures.push(feeDisclosures);

  //   return disclosures;
  // }

  // feeDisclosures(fees: FeeWithDate[], currency: string): string[] {
  //   if (!fees?.length) return undefined;
  //   const disclosures = [];
  //   fees.forEach(({ fee }) => {
  //     // if fee is exclusive, include in disclosure
  //     if (fee.type === FeeType.Exclusive) {
  //       // build disclosure string
  //       // Exclusive of {feeName} {currency amount | percentage} {perCondition/FeeChargeType}
  //       const feeName = fee.name;
  //       const amountType = feeConverter.amountTypeToString(fee, currency);
  //       const chargeType = feeConverter.chargeTypeToString(fee);

  //       const disclosureString = `Exclusive of ${feeName} ${amountType} ${chargeType}`;
  //       disclosures.push(disclosureString);
  //     }
  //   });

  //   return disclosures;
  // }
}
