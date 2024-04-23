import {Service} from 'typedi';
import {MetaDataRecord} from '../../database/models/MetaDataRecord';
import {MetaDataRepository} from '../../database/repositories/MetaDataRepository';
import {OrmRepository} from 'typeorm-typedi-extensions';
import {generateUUID} from '../../lib/uuid';
import {LoggerFactory} from '../../lib/logger';

@Service()
export class MetaDataService {
    private log = LoggerFactory.createLogger('metadata service');
    constructor(
        @OrmRepository() private customDataRepository: MetaDataRepository
    ) {
    }

    public async findCustomDataById(providerId: string, dataType: string, identifiers: string[]): Promise<MetaDataRecord[]> {
        // validate required params - empty
        if (isEmptyOrUndefined(providerId) || isEmptyOrUndefined(dataType) || !Array.isArray(identifiers) || identifiers.length === 0) {
            return [];
        }

        const query = {
            where: {
                $and: [
                    {
                        identifiers: {
                            $in: identifiers,
                        },
                    },
                    {providerId},
                    {dataType},
                ],
            },
        };
        return await this.customDataRepository.find(query);
    }

    public async storeCustomData<T>(providerId: string, dataType: string, identifiers: string[], customData: T): Promise<MetaDataRecord> {
        // validate required params - empty
        if (isEmptyOrUndefined(providerId) || isEmptyOrUndefined(dataType) || !Array.isArray(identifiers) || identifiers.length === 0) {
            this.log.error(`invalid parameters, providerId:[${providerId}],dataType:[${dataType}], identifiers:[${identifiers}`);
            throw new Error('Invalid input, one of required parameters is missing or empty');
        }
        const record = new MetaDataRecord();
        record.providerId = providerId;
        record.contextId = generateUUID();
        record.dataType = dataType;
        record.customData = customData;
        record.identifiers = identifiers;
        record.creationDate = new Date();
        await this.customDataRepository.save(record);
        return record;
    }

    public async findCustomDataByContextId(contextId: string): Promise<MetaDataRecord[]> {
        return await this.customDataRepository.find({where: {contextId}});
    }
}
const isEmptyOrUndefined = (param: string) => {
    return param === undefined || param === null || param.trim().length === 0;
};
