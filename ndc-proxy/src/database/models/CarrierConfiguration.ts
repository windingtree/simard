import {Entity, ObjectID, ObjectIdColumn, Column, Index} from 'typeorm';
import {Exclude} from 'class-transformer';
import {IsBoolean, IsNotEmpty, IsNumber, IsString} from 'class-validator';

@Entity()
export class CarrierConfiguration {
    @ObjectIdColumn()
    @Exclude()
    public id: ObjectID;

    @IsNotEmpty()
    @IsString()
    @Index({unique: true})
    @Column({name: 'carrierCode'})
    public carrierCode: string;

    @Column(type => BrandedFare)
    public brandedFares: BrandedFare[];
}

export class Amenity {
  @IsNotEmpty()
  @IsString()
  @Column({name: 'name'})
  public name: string;

}

export class BrandedFare {
    @IsNotEmpty()
    @IsString()
    @Column({name: 'brandedFareId'})
    public brandedFareId: string;

    @IsNotEmpty()
    @IsString()
    @Column({name: 'marketingName'})
    public marketingName: string;

    @IsBoolean()
    @Column({name: 'isRefundable'})
    public isRefundable: boolean | undefined;

    @IsBoolean()
    @Column({name: 'isChangeable'})
    public isChangeable: boolean | undefined;

    @IsBoolean()
    @Column({name: 'isPenalty'})
    public isPenalty: boolean | undefined;

    @IsNumber()
    @IsNotEmpty()
    @Column({name: 'checkedBagsIncluded'})
    public checkedBagsIncluded: number;

    @Column(type => Amenity)
    public amenities: Amenity[];
}
