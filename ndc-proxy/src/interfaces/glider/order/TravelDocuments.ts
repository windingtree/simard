import {IsArray, IsOptional} from 'class-validator';

export class TravelDocuments {
    @IsOptional()
    @IsArray()
    public etickets: string[] = [];

    @IsOptional()
    @IsArray()
    public bookings: string[] = [];

    constructor(etickets?: string[], bookings?: string[]) {
        this.etickets = etickets;
        this.bookings = bookings;
    }
}
