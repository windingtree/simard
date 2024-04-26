import { Inject, Service } from "typedi";
import { DerbysoftSearchRequestForLiveCheck } from "../../types/api/DerbysoftOffersSearch";
import { DerbysoftSearchConverter } from "../../converters/search/DerbysoftSearchConverter";
import { DerbysoftSupplierClient } from "../../clients/DerbysoftSupplierClient";
import { ConfigService } from "../common/ConfigService";
import { BaseOffersService } from "../offers/BaseOffersService";
import { OffersMetadataService } from "../offers/OffersMetadataService";
import { DerbysoftSearchMetadata } from "../../types/api/DerbysoftSearchMetadata";
import { DerbysoftOfferPriceConverter } from "../../converters/pricing/DerbysoftOfferPriceConverter";
import { DerbysoftPricingMetadata } from "../../types/api/DerbysoftOfferPricingMetadata";
import {
  ActiveStatus,
  AvailableHotel,
  ShoppingUsbMultiHotelSearchResponse,
} from "@simardwt/derbysoft-types";
import {
  SearchResponse,
  PricedOfferResponse,
  SearchCriteria,
} from "@windingtree/glider-types/dist/accommodations";
import { HotelOTAError } from "../../types";
import { SessionContext } from "../../types/shared/SessionContext";
import { plainToClass } from "class-transformer";
import { decodeAccommodationId } from "../../utils/accommodation";
import { getPricedOffersValidation, searchOffersValidation } from "../../validation";

@Service()
export class DerbysoftOffersService extends BaseOffersService {
  @Inject()
  private derbySoftSearchConverter: DerbysoftSearchConverter;

  @Inject()
  private derbysoftOfferPriceConverter: DerbysoftOfferPriceConverter;

  @Inject()
  private offersMetadataService: OffersMetadataService;

  private _distributorId: string;
  private _bookingAccessToken: string;
  private _bookingBaseURL: string;
  private _shoppingAccessToken: string;
  private _shoppingBaseURL: string;
  private _derbysoftSupplierClient: DerbysoftSupplierClient;

  constructor(useEnvConfig = true) {
    super("DERBYSOFT");
    this.initialize(useEnvConfig);
    this._derbysoftSupplierClient = new DerbysoftSupplierClient(
      this.distributorId,
      this._bookingAccessToken,
      this.bookingBaseURL,
      this._shoppingAccessToken,
      this.shoppingBaseURL
    );
  }

  public get derbysoftSupplierClient(): DerbysoftSupplierClient {
    return this._derbysoftSupplierClient;
  }

  public get distributorId(): string {
    return this._distributorId;
  }

  public get shoppingAccessToken(): string {
    return this._shoppingAccessToken;
  }

  public get bookingAccessToken(): string {
    return this._bookingAccessToken;
  }

  public get shoppingBaseURL(): string {
    return this._shoppingBaseURL;
  }

  public get bookingBaseURL(): string {
    return this._bookingBaseURL;
  }

  private initialize(useEnvConfig: boolean): void {
    // populate config values from config source (.env OR httpService)
    const configService = new ConfigService(useEnvConfig);
    const config = configService.getConfig("derbysoft");
    this._distributorId = config["distributorId"];
    this._shoppingAccessToken = config["shoppingAccessToken"];
    this._bookingAccessToken = config["bookingAccessToken"];
    this._bookingBaseURL = config["bookingBaseURL"];
    this._shoppingBaseURL = config["shoppingBaseURL"];
  }

  public async searchForOffers(
    context: SessionContext,
    searchParams: SearchCriteria,
    liveCheck?: string
  ): Promise<SearchResponse> {
    // validate search params
    searchOffersValidation(searchParams, liveCheck);

    // convert request to a derbysoft search request type
    const derbysoftSearchRequest = await this.derbySoftSearchConverter.WtToDerbysoftRequest(
      context,
      searchParams
    );

    let searchResults: ShoppingUsbMultiHotelSearchResponse;

    if (liveCheck === "true") {
      // get first hotel in request body and assign to hotelId
      const encodedAccommodationId = searchParams.accommodation.hotelIds[0];
      const { hotelId, supplierId } = decodeAccommodationId(encodedAccommodationId, "DS");

      if (supplierId !== context.supplierId) {
        throw new HotelOTAError(`Invalid accommodationId: '${encodedAccommodationId}'`, 400);
      }

      derbysoftSearchRequest.hotelId = hotelId;

      const results = await this.derbysoftSupplierClient.searchHotel(
        context.supplierId,
        derbysoftSearchRequest as DerbysoftSearchRequestForLiveCheck
      );
      searchResults = new ShoppingUsbMultiHotelSearchResponse();
      searchResults.header = results.header;
      searchResults.iata = results.iata;
      const availHotel = plainToClass(AvailableHotel, {
        availRoomRates: results.roomRates,
        hotelId,
        iata: results.iata,
        supplierId: results.header.supplierId,
        stayRange: results.stayRange,
        status: ActiveStatus.Actived,
        roomCriteria: results.roomCriteria,
      });
      searchResults.availHotels = [availHotel];
    } else {
      // search derbysoft for hotels

      searchResults = await this.derbysoftSupplierClient.searchMultiHotels(
        context.supplierId,
        derbysoftSearchRequest
      );
    }

    // convert search results to windingTree response
    const wtSearchResults = await this.derbySoftSearchConverter.DerbysoftToWtResponse(
      context,
      derbysoftSearchRequest,
      searchResults
    );

    // we must have at least one offer
    if (!Object.keys(wtSearchResults.offers).length) {
      throw new HotelOTAError("No offers available", 404);
    }

    // save original response/search metadata
    await this.offersMetadataService.saveShoppingMetadata<DerbysoftSearchMetadata>(
      this.providerId,
      context,
      Object.keys(wtSearchResults.offers),
      wtSearchResults.searchMetadata as DerbysoftSearchMetadata
    );

    // save response in DB
    await this.offersStorageService.storeSearchResults(this.providerId, wtSearchResults);

    delete wtSearchResults.searchMetadata;

    return wtSearchResults;
  }

  public async getPricedOffers(
    context: SessionContext,
    offerIDs: string[]
  ): Promise<PricedOfferResponse> {
    // validate offerIds
    getPricedOffersValidation(offerIDs);

    // convert request
    const derbysoftOfferPriceRequest = await this.derbysoftOfferPriceConverter.WtToDerbysoftRequest(
      context,
      {
        offerIDs,
      }
    );

    // only one offer ID is relevant, so we take the first one
    const offerId = offerIDs[0];

    // do a live check to ensure the offer is still available
    const liveCheckRequest = new DerbysoftSearchRequestForLiveCheck(
      [],
      derbysoftOfferPriceRequest.stayRange,
      derbysoftOfferPriceRequest.roomCriteria
    );

    // include loyaltyAccount details
    liveCheckRequest.loyaltyAccount = derbysoftOfferPriceRequest.loyaltyAccount;

    // NOTE: There is actually only one rate selected in offer (1-element array)
    // Later try to figure out reason for using array
    liveCheckRequest.productCandidate = {
      roomId: derbysoftOfferPriceRequest.roomRates[0].roomId,
      rateId: derbysoftOfferPriceRequest.roomRates[0].rateId,
    };

    liveCheckRequest.hotelId = derbysoftOfferPriceRequest.hotelId;

    const results = await this.derbysoftSupplierClient.searchHotel(
      context.supplierId,
      liveCheckRequest
    );

    // if the original offer no longer exists return with error
    if (!results.roomRates.length) {
      throw new HotelOTAError(
        `The offer requested is no longer available or expired. Please make a new search`,
        400
      );
    }

    // make request to derbysoft to prebook
    const offerPrice = await this.derbysoftSupplierClient.preBook(
      context.supplierId,
      derbysoftOfferPriceRequest
    );

    // convert offer price to WT response
    const wtOfferPrice = await this.derbysoftOfferPriceConverter.DerbysoftToWtResponse(
      context,
      derbysoftOfferPriceRequest,
      offerPrice,
      offerId
    );

    // save offerPrice metadata in DB
    await this.offersMetadataService.saveOfferPriceMetadata<DerbysoftPricingMetadata>(
      this.providerId,
      context,
      [wtOfferPrice.offerId],
      wtOfferPrice.offerPriceMetadata as DerbysoftPricingMetadata
    );

    delete wtOfferPrice.offerPriceMetadata;

    return wtOfferPrice;
  }
}
