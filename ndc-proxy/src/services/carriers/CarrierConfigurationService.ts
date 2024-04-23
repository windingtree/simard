import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import {CarrierConfigurationRepository} from '../../database/repositories/CarrierConfigurationRepository';
import {BrandedFare, CarrierConfiguration} from '../../database/models/CarrierConfiguration';

@Service()
export class CarrierConfigurationService {

    constructor(
        @OrmRepository() private carrierConfigurationRepository: CarrierConfigurationRepository,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public async getCarrierConfiguration(carrierCode: string): Promise<CarrierConfiguration|undefined> {
        const results: CarrierConfiguration[] = await this.carrierConfigurationRepository.find({where: {carrierCode}});
        if (results && results.length > 0) {
            return results[0];
        } else {
            return undefined;
        }
    }

    public update(carrierCode: string, config: CarrierConfiguration): Promise<CarrierConfiguration> {
        return this.carrierConfigurationRepository.save(config);
    }

    public async delete(carrierCode: string): Promise<void> {
        this.log.info('Delete a user');
        await this.carrierConfigurationRepository.delete({carrierCode});
        return;
    }

    // TODO use cache here!!!! Important!
    public async getBrandedFare(carrierCode: string, brandedFareId: string): Promise<BrandedFare|undefined> {
        const carrierConfig = await this.getCarrierConfiguration(carrierCode);
        let brandedFareResult = undefined;
        if (carrierConfig && carrierConfig.brandedFares) {
            brandedFareResult = carrierConfig.brandedFares.find(brandedFare => brandedFare.brandedFareId === brandedFareId);
        }
        this.log.debug(`Search for branded fare ${carrierCode}/${brandedFareId}, found:`, brandedFareResult);
        return brandedFareResult;
    }

}
