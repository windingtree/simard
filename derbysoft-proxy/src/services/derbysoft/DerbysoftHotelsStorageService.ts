import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import { EDerbysoftHotel } from "../../database/models/EDerbysoftHotel";
import { DerbysoftHotelsRepository } from "../../database/repositories/DerbysoftHotelsRepository";
//import { getAccommodationIdFromHotelId } from "../../utils/accommodation";
import { HotelsStorageService } from "../hotel/HotelsStorageService";

@Service()
export class DerbysoftHotelsStorageService extends HotelsStorageService<EDerbysoftHotel> {
  @InjectRepository()
  protected hotelsRepository: DerbysoftHotelsRepository;
}
