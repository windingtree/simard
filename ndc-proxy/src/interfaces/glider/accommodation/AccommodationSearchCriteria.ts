import {IsDate, IsNotEmpty, ValidateNested} from 'class-validator';
import {LocationInformation} from './Location';
import {Type} from 'class-transformer';

interface AccommodationSearchCriteriaConstuctorParameters {
    arrival: Date;
    departure: Date;
    location: LocationInformation;
}

export class AccommodationSearchCriteria {

    @IsDate()
    @Type(() => Date)
    public arrival: Date;

    @IsDate()
    @Type(() => Date)
    public departure: Date;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => LocationInformation)
    public location: LocationInformation;

    constructor(params?: AccommodationSearchCriteriaConstuctorParameters) {
        if (params) {
            const {arrival, departure, location} = params;
            this.arrival = arrival;
            this.departure = departure;
            this.location = location;
        }
    }
}
