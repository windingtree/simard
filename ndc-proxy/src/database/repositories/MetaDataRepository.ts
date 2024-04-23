import { EntityRepository, Repository } from 'typeorm';

import {MetaDataRecord} from '../models/MetaDataRecord';

@EntityRepository(MetaDataRecord)
export class MetaDataRepository extends Repository<MetaDataRecord>  {

}
