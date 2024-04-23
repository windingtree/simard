import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import {HotelRepository} from '../../database/repositories/HotelRepository';
import {Hotel} from '../../database/models/Hotel';
import {env} from '../../env';
import {LocationPoint} from '../../interfaces/glider';

@Service()
export class HotelService {

    public public;

    constructor(
        @OrmRepository() private hotelRepository: HotelRepository,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public async findHotelsAtLocation(location: LocationPoint): Promise<Hotel[]> {
        const radiusInKilometers = env.hotels.defaultSearchRadiusInKm;
        const results = await this.hotelRepository.findByLocation(location, radiusInKilometers);
        this.log.debug(`Search for hotels at location: ${location}, search radius:${radiusInKilometers}, found: ${results.length} hotels`);
        return results;
    }

    public findAll(): Promise<Hotel[]> {
        this.log.debug('Findall');
        return this.hotelRepository.find();
    }
    public save(hotel: Hotel): Promise<Hotel> {
        this.log.debug('save', hotel);
        return this.hotelRepository.save(hotel);
    }

}
