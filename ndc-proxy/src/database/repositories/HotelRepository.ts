import { EntityRepository, Repository } from 'typeorm';

import {Hotel} from '../models/Hotel';
import {LocationPoint} from '../../interfaces/glider';

const KILOMETERS_to_RADIUS_RATIO = Number(0.000156785);

@EntityRepository(Hotel)
export class HotelRepository extends Repository<Hotel>  {

    public findByLocation(location: LocationPoint, radiusInKilometers: number): Promise<Hotel[]> {
        return super.find({
            where: {
                location: {
                    $geoWithin: {
                        $centerSphere: [
                            [
                                location.long,
                                location.lat,
                            ],
                            radiusInKilometers * KILOMETERS_to_RADIUS_RATIO,
                        ],
                    },
                },
            },
        });
    }
}
