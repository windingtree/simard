import {EntityRepository, MongoRepository} from 'typeorm';

import {CarrierConfiguration} from '../models/CarrierConfiguration';

@EntityRepository(CarrierConfiguration)
export class CarrierConfigurationRepository extends MongoRepository<CarrierConfiguration>  {

}
