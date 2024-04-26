import { BaseWTDerbysoftConverter } from "../interfaces/BaseWTDerbysoftConverter";
import Container, { Service } from "typedi";
import {
  DerbysoftSearchRequest,
  DerbysoftSearchResponse,
} from "../../types/api/DerbysoftOffersSearch";
import { SearchCriteria, SearchResponse } from "@windingtree/glider-types/dist/accommodations";

import { ActiveStatus, SupplierHotelDetail } from "@simardwt/derbysoft-types";
import { DerbysoftToWTSearchResponseBuilder } from "./DerbysoftToWTSearchResponseBuilder";
import { DerbysoftHotelsService } from "../../services/derbysoft/DerbysoftHotelsService";
import { HotelOTAError } from "../../types";
import { EDerbysoftHotel } from "../../database/models/EDerbysoftHotel";
import { getHotelIdFromAccommodationId } from "../../utils/accommodation";
import { SessionContext } from "../../types/shared/SessionContext";
import { toRoomCriteria } from "../common/passengersConverter";
import { toStayRange } from "../common/stayRange";
import { BusinessRulesFactory } from "../../businessRules/BusinessRulesFactory";

@Service()
export class DerbysoftSearchConverter extends BaseWTDerbysoftConverter<
  SearchCriteria,
  SearchResponse,
  DerbysoftSearchRequest,
  DerbysoftSearchResponse
> {
  //@Inject()
  private derbysoftHotelsService: DerbysoftHotelsService;

  constructor() {
    super();
  }

  public async WtToDerbysoftRequest(
    context: SessionContext,
    wtRequest: SearchCriteria
  ): Promise<DerbysoftSearchRequest> {
    // extract the following details to build the search request
    // hotels: SupplierHotelDetail[]
    // using coordinates, search for matching hotels in mongoDB
    const {
      location,
      arrival,
      departure,
      roomCount = 1,
      hotelIds: accommodationIds,
    } = wtRequest.accommodation;
    this.derbysoftHotelsService = Container.get(DerbysoftHotelsService);

    // hotelIds takes precedence over location
    let derbysoftHotels: EDerbysoftHotel[];
    if (accommodationIds) {
      // extract hotelIds
      const hotelIds = accommodationIds.map((accommodationId) =>
        getHotelIdFromAccommodationId(accommodationId, context.supplierId)
      );

      // get hotels by Ids
      derbysoftHotels = await this.derbysoftHotelsService.findHotelsByIds(hotelIds, context);

      if (!derbysoftHotels.length) {
        throw new HotelOTAError("No hotels with given Ids found", 404);
      }
    } else {
      derbysoftHotels = await this.derbysoftHotelsService.getAllHotelsByCoordinates(
        context,
        location,
        {
          providerId: "DERBYSOFT",
          "customData.supplierId": context.supplierId,
        }
      );

      if (!derbysoftHotels.length) {
        throw new HotelOTAError("No hotels found within specified coordinates", 404);
      }
    }

    const hotels: SupplierHotelDetail[] = [];
    for (const hotel of derbysoftHotels) {
      const supplierDetail = new SupplierHotelDetail();
      supplierDetail.hotelId = hotel.providerHotelId;
      supplierDetail.supplierId = context.supplierId;
      supplierDetail.status = ActiveStatus.Actived; // TODO: are we sure they are active?
      hotels.push(supplierDetail);
    }

    // convert departure and arrival to stayRange
    const stayRange = toStayRange(arrival, departure);

    // roomCriteria: RoomCriteria
    const roomCriteria = toRoomCriteria(wtRequest.passengers, roomCount);

    // iata?: string - TO-DO?
    // extensions?: ShoppingExtensions - TO-DO?

    const derbysoftSearchRequest = new DerbysoftSearchRequest(hotels, stayRange, roomCriteria);

    // apply appropriate business rules
    const processedSearchRequest = BusinessRulesFactory.getBusinessRules(
      context.supplierId
    ).processSearchRequest(wtRequest, derbysoftSearchRequest);

    return processedSearchRequest;
  }

  public async DerbysoftToWtResponse(
    context: SessionContext,
    derbySoftRequest: DerbysoftSearchRequest,
    derbysoftResponse: DerbysoftSearchResponse
  ): Promise<SearchResponse> {
    this.derbysoftHotelsService = Container.get(DerbysoftHotelsService);
    const responseBuilder = new DerbysoftToWTSearchResponseBuilder(
      context,
      derbySoftRequest,
      derbysoftResponse,
      this.derbysoftHotelsService
    );

    const result = await responseBuilder.build();
    result.rawResponse = derbysoftResponse;
    return result;
  }
}
