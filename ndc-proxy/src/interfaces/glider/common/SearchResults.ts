import {IsArray,  IsNotEmpty, IsString, ValidateNested} from 'class-validator';
import { Offer} from './index';
import {Type} from 'class-transformer';
import {Segment} from '../air';
import {Accommodation} from '../accommodation';
import {PricePlan} from './index';
import {Passenger} from './index';
import {mapToObj} from '../mapToObj';

export interface PricePlanReferenceConstructorParameters {
    accommodation?: string;
    roomType?: string;
    flights?: string[];
}

export class PricePlanReference {
    @IsString()
    @IsNotEmpty()
    public accommodation: string;

    @IsString()
    @IsNotEmpty()
    public roomType: string;

    @IsArray()
    @ValidateNested({each: true})
    public flights: string[];

    constructor({accommodation, flights, roomType}: PricePlanReferenceConstructorParameters) {
        this.accommodation = accommodation;
        this.roomType = roomType;
        this.flights = flights ? flights : [];
    }
}

export class Itineraries {
    @ValidateNested({each: true})
    @Type(() => Segment)
    public segments: Map<string, Segment>;

    @ValidateNested({each: true})
    public combinations: Map<string, string[]>;
}

export class SearchResults {
    @ValidateNested({each: true})
    @Type(() => Offer)
    public offers: Map<string, Offer>;

    @ValidateNested({each: true})
    public itineraries: Itineraries;

    @ValidateNested({each: true})
    @Type(() => Accommodation)
    public accommodations: Map<string, Accommodation>;

    @ValidateNested({each: true})
    @Type(() => PricePlan)
    public pricePlans: Map<string, PricePlan>;

    @ValidateNested({each: true})
    @Type(() => Passenger)
    public passengers: Map<string, Passenger>;

    public toJSON(): any {
        return {
            passengers: mapToObj(this.passengers),
            offers: mapToObj(this.offers),
            pricePlans: mapToObj(this.pricePlans),
            itineraries: mapToObj(this.itineraries),
        };
    }
}

/*
const a = {
    combinations: {
        combination1: ['elem1', 'elem2'],
        combination2: ['elem2', 'elem3'],
    },
};
*/
