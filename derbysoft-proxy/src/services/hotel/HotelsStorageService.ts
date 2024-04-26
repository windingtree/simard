import { EHotel } from "../../database/models/EHotel";
import { HotelsRepository } from "../../database/repositories/HotelsRepository";
import { Service } from "typedi";
import { DeepPartial } from "typeorm";
import { EntityFieldsNames } from "typeorm/common/EntityFieldsNames";
import { InjectRepository } from "typeorm-typedi-extensions";

export type SortOrder<Entity> = {
  [P in EntityFieldsNames<Entity>]?: "ASC" | "DESC" | 1 | -1;
};

@Service()
export abstract class HotelsStorageService<T extends EHotel> {
  @InjectRepository()
  protected hotelsRepository: HotelsRepository<T>;

  public async storeHotels(
    hotels: unknown[],
    matchFields: string[],
    transformFunction?: (hotel) => T
  ) {
    const savedHotels = hotels.map(async (hotel) => {
      const hotelEntity =
        typeof transformFunction === "function" ? transformFunction(hotel) : (hotel as T);
      return this.hotelsRepository.mongoUpsert(hotelEntity as DeepPartial<T>, matchFields);
    });

    return Promise.allSettled(savedHotels);
  }

  public async getAllHotels(
    conditions: {
      [field: string]: unknown;
    } = {},
    sortOrder?: SortOrder<T>
  ): Promise<T[]> {
    if (sortOrder) {
      return this.hotelsRepository.find({ where: conditions, order: sortOrder });
    } else {
      return this.hotelsRepository.find(conditions);
    }
  }

  public async saveHotel(hotel: T) {
    return this.hotelsRepository.save(hotel as DeepPartial<T>);
  }
}
