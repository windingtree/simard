import { EntityRepository } from "typeorm";
import { EDerbysoftHotel } from "../models/EDerbysoftHotel";
import { HotelsRepository } from "./HotelsRepository";

@EntityRepository(EDerbysoftHotel)
export class DerbysoftHotelsRepository extends HotelsRepository<EDerbysoftHotel> {}
