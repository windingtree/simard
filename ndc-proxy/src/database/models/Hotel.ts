import {Entity, ObjectID, ObjectIdColumn, Column} from 'typeorm';
import {IsNotEmpty,  IsString} from 'class-validator';
import {Exclude} from 'class-transformer';
import {BaseEntity} from './BaseEntity';

export class GeoLocationPoint {
    public coordinates: number[];
    public type = 'Point';

    constructor(lon: number,  lat: number) {
        this.coordinates = [lon, lat];
    }
}

@Entity()
export class Hotel extends BaseEntity {
    @ObjectIdColumn()
    @Exclude()
    public id: ObjectID;

    @IsNotEmpty()
    @IsString()
    @Column({name: 'location'})
    public location: GeoLocationPoint;

    @IsString()
    @Column({name: 'name'})
    public name: string;

    @IsString()
    @Column({name: 'address'})
    public address: string;

    constructor(location: GeoLocationPoint, name: string, address: string) {
        super();
        this.location = location;
        this.name = name;
        this.address = address;
    }
}
