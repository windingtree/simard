import {Mapping} from '../../../lib/uuid';
import {NDCSeatAvailabilityResponse} from '../../../interfaces/ndc';

export interface SeatMapMetadataContainer {
    mapping: Mapping;
    seatMapResponse: NDCSeatAvailabilityResponse;
}
