import { Accommodation, LocationSearch } from "@windingtree/glider-types/dist/accommodations";
import { NextFunction, Response } from "express";
import Container, { Service } from "typedi";
import { DerbysoftHotelsService } from "../../../services/derbysoft/DerbysoftHotelsService";
import { HotelOTAError } from "../../../types";
import { EnhancedRequest } from "../../../types/api/common";
import { BaseController } from "./baseController";
import { buildAccommodation } from "../../../services/derbysoft/DerbysoftUtils";
import { EDerbysoftHotel } from "../../../database/models/EDerbysoftHotel";
import { SessionContext } from "../../../types/shared/SessionContext";
import { BusinessRulesFactory } from "../../../businessRules/BusinessRulesFactory";

@Service()
export class HotelsController extends BaseController {
  private get hotelsService(): DerbysoftHotelsService {
    return Container.get(DerbysoftHotelsService);
  }

  private throwNoHotelsFoundError() {
    const noHotelsFoundMessage = "No hotels/accommodations found";
    throw new HotelOTAError(noHotelsFoundMessage, 404);
  }

  private extractAccommodations = (
    hotels: EDerbysoftHotel[],
    context: SessionContext
  ): Accommodation[] => {
    if (!hotels?.length) {
      this.throwNoHotelsFoundError();
    }

    // get rooms type filter if any
    const roomTypesFilter = BusinessRulesFactory.getBusinessRules(
      context.supplierId
    ).roomTypesFilter;

    const accommodations = hotels.map((hotel) =>
      buildAccommodation(hotel, undefined, true, roomTypesFilter)
    );

    return accommodations;
  };

  public getAllHotels = async (
    { sessionContext }: EnhancedRequest,
    res: Response,
    next: NextFunction
  ) => {
    // call hotels service with required parameters
    try {
      const hotels = await this.hotelsService.getAllHotelsByContext(sessionContext);
      const accommodations = this.extractAccommodations(hotels, sessionContext);

      res.status(200).json(accommodations);
    } catch (error) {
      next(error);
    }
  };

  public getAllHotelsByCoordinates = async (
    { body, sessionContext }: EnhancedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const location: LocationSearch = body.location;
      const hotels = await this.hotelsService.getAllHotelsByCoordinates(sessionContext, location);
      const accommodations = this.extractAccommodations(hotels, sessionContext);

      res.status(200).json(accommodations);
    } catch (error) {
      next(error);
    }
  };

  public getHotelsByIds = async (
    { body, sessionContext }: EnhancedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const accommodationIds = body.accommodationIds;
      const hotels = await this.hotelsService.findHotelsByAccommodationIds(
        accommodationIds,
        sessionContext
      );
      const accommodations = this.extractAccommodations(hotels, sessionContext);

      res.status(200).json(accommodations);
    } catch (error) {
      next(error);
    }
  };
}
