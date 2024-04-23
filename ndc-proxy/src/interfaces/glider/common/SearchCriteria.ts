import {FlightSearchCriteria} from '../air';
import {PassengerSearchCriteria} from './PassengerSearchCriteria';
import {AccommodationSearchCriteria} from '../accommodation';
import {ArrayMinSize, ValidateNested} from 'class-validator';
import { Type } from 'class-transformer';

// TODO add custom validation to check if accommodation or itinerary is present
export class SearchCriteria  {
    public static createAccommodationSearchCriteriaInstance(accommodation: AccommodationSearchCriteria, passengers: PassengerSearchCriteria[]): SearchCriteria {
        const instance = new SearchCriteria();
        instance.accommodation = accommodation;
        instance.passengers = passengers;
        return instance;
    }
    public static createFlightSearchCriteriaInstance(itinerary: FlightSearchCriteria, passengers: PassengerSearchCriteria[]): SearchCriteria {
        const instance = new SearchCriteria();
        instance.itinerary = itinerary;
        instance.passengers = passengers;
        return instance;
    }
    @ValidateNested()
    @Type(() => AccommodationSearchCriteria)
    public accommodation: AccommodationSearchCriteria;

    @ValidateNested()
    @Type(() => FlightSearchCriteria)
    public itinerary: FlightSearchCriteria;

    @ValidateNested({ each: true })
    @Type(() => PassengerSearchCriteria)
    @ArrayMinSize(1)
    public passengers: PassengerSearchCriteria[];
}
