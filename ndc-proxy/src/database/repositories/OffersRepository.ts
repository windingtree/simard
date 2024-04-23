import {EntityRepository, MongoRepository} from 'typeorm';

import {EOffer} from '../models/EOffer';

@EntityRepository(EOffer)
export class OffersRepository extends MongoRepository<EOffer>  {

}
