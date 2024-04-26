import { EntityRepository } from "typeorm";
import { ESystemVariable } from "../models/ESystemVariable";
import { BaseRepository } from "./BaseRepository";

@EntityRepository(ESystemVariable)
export class SystemVariablesRepository extends BaseRepository<ESystemVariable> {}
