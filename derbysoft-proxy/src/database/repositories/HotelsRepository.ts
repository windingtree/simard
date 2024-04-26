import { EntityRepository } from "typeorm";
import { EHotel } from "../models/EHotel";
import { BaseRepository } from "./BaseRepository";

@EntityRepository(EHotel)
export class HotelsRepository<T extends EHotel> extends BaseRepository<T> {}
