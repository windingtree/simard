import {EntityRepository, MongoRepository} from 'typeorm';
import {EOrder} from '../models/EOrder';

@EntityRepository(EOrder)
export class OrderRepository extends MongoRepository<EOrder>  {

}
