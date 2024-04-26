import {
  LocationCircle,
  LocationRectangle,
  LocationSearch,
} from "@windingtree/glider-types/dist/accommodations";
import { Service } from "typedi";
import { EHotel } from "../../database/models/EHotel";
import { KeyValuePairs } from "../../types";
import { HotelOTAError } from "../../types/shared/HotelOTAError";
import { EnforceSessionContext, SessionContext } from "../../types/shared/SessionContext";
import { HotelsStorageService, SortOrder } from "./HotelsStorageService";
import { getHotelsValidation } from "../../validation";

// This class will be implemented by various aggregators
@Service()
export abstract class BaseHotelsService<HotelEntity extends EHotel>
  implements EnforceSessionContext<BaseHotelsService<HotelEntity>>
{
  protected hotelsStorageService: HotelsStorageService<HotelEntity>;

  // sync hotels from provider with hotels in DB
  protected abstract syncHotels(): Promise<number>;

  // build filterCriteria from context implemented in child
  protected abstract buildFilterCriteriaFromSearchContext(context: SessionContext): KeyValuePairs;

  // TO-DO: Refactor all query methods to be supplier specific

  // get all hotels in DB
  public async getAllHotels(
    context?: SessionContext,
    filterCriteria?: {
      [key: string]: unknown;
    },
    sortOrder?: SortOrder<HotelEntity>
  ): Promise<HotelEntity[]> {
    if (context) {
      filterCriteria = {
        ...filterCriteria,
        ...this.buildFilterCriteriaFromSearchContext(context),
      };
    }

    // get all hotels saved in DB
    const hotels = await this.hotelsStorageService.getAllHotels(
      filterCriteria as KeyValuePairs,
      sortOrder
    );

    return hotels as HotelEntity[];
  }

  // find hotels by circular coordinates using nearSphere
  protected async findHotelsByCircle(
    circle: LocationCircle,
    filterCriteria: KeyValuePairs = {}
  ): Promise<HotelEntity[]> {
    const hotels = await this.hotelsStorageService.getAllHotels({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [circle.long, circle.lat],
          },
          $minDistance: 0,
          $maxDistance: circle.radius, // NOTE: this is in meters
        },
      },
      ...filterCriteria,
    });
    return hotels as HotelEntity[];
  }

  // find hotels by rectangular coordinates using find
  protected async findHotelsByRectangle(
    rectangle: LocationRectangle,
    filterCriteria: KeyValuePairs = {}
  ): Promise<HotelEntity[]> {
    const hotels = await this.hotelsStorageService.getAllHotels({
      "location.coordinates.0": {
        $gte: rectangle.west,
        $lte: rectangle.east,
      },
      "location.coordinates.1": {
        $gte: rectangle.south,
        $lte: rectangle.north,
      },
      ...filterCriteria,
    });
    return hotels as HotelEntity[];
  }

  // find hotels by circular coordinates using geoWithin
  protected async findHotelsByCircleWithin(
    circle: LocationCircle,
    filterCriteria: KeyValuePairs = {}
  ): Promise<HotelEntity[]> {
    const hotels = await this.hotelsStorageService.getAllHotels({
      location: {
        $geoWithin: {
          $circle: [[circle.long, circle.lat], circle.radius],
        },
      },
      ...filterCriteria,
    });
    return hotels as HotelEntity[];
  }

  // find hotels by rectangular coordinates using geoWithin
  protected async findHotelsByRectangleWithin(
    rectangle: LocationRectangle,
    filterCriteria: KeyValuePairs = {}
  ): Promise<HotelEntity[]> {
    const hotels = await this.hotelsStorageService.getAllHotels({
      location: {
        $geoWithin: {
          $box: [
            [rectangle.west, rectangle.south],
            [rectangle.east, rectangle.north],
          ],
        },
      },
      ...filterCriteria,
    });
    return hotels as HotelEntity[];
  }

  // convert provider specific hotel object to a Hotel entity
  protected abstract convertHotelToEntity(hotel: unknown): HotelEntity;

  public getAllHotelsByCoordinates(
    context: SessionContext,
    location: LocationSearch,
    filterCriteria?: KeyValuePairs
  ) {
    // validate location
    getHotelsValidation({ location });

    // search for hotels by coordinates by supplier
    if (context) {
      filterCriteria = {
        ...filterCriteria,
        ...this.buildFilterCriteriaFromSearchContext(context),
      };
    }

    // used with AWS DocumentDB - no support for within
    const { circle, rectangle } = location || {};
    if (circle) {
      return this.findHotelsByCircle(circle, filterCriteria);
    } else if (rectangle) {
      return this.findHotelsByRectangle(rectangle, filterCriteria);
    } else {
      throw new HotelOTAError("Invalid location provided. Must be a circle or rectangle");
    }
  }

  // TO-DO: include supplier-specific business rules to futher restrict search results
  public getAllHotelsByCoordinatesWithin(
    context: SessionContext,
    location: LocationSearch,
    filterCriteria?: KeyValuePairs
  ) {
    // search for hotels by coordinates by supplier
    if (context) {
      filterCriteria = {
        ...filterCriteria,
        ...this.buildFilterCriteriaFromSearchContext(context),
      };
    }

    const { circle, rectangle } = location || {};
    if (circle) {
      return this.findHotelsByCircleWithin(circle, filterCriteria);
    } else if (rectangle) {
      return this.findHotelsByRectangleWithin(rectangle, filterCriteria);
    } else {
      throw new HotelOTAError("Invalid location provided. Must be a circle, rectangle or polygon");
    }
  }

  // providerId: predefined constant identifier for hotel aggregator
  constructor(protected providerId: string) {}
}
