import {IsArray, IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested} from 'class-validator';
import {CheckInOutPolicy} from './CheckInOutPolicy';
import {ContactInformation} from './ContactInformation';
import {LocationInformation} from './Location';
import {MediaItem} from './MediaItem';
import {Type} from 'class-transformer';
import {RoomType} from './RoomType';
import {AccommodationType} from './AccommodationType';

export class Accommodation {
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => CheckInOutPolicy)
    public checkinoutPolicy: CheckInOutPolicy;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => ContactInformation)
    public contactInformation: ContactInformation;

    @IsString()
    public description: string;

    @Type(() => LocationInformation)
    @ValidateNested({ each: true })
    public location: LocationInformation;

    @ValidateNested({ each: true })
    @Type(() => MediaItem)
    public media: MediaItem[];

    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsArray()
    public otherPolicies: string[];

    @IsNumber()
    public rating: number;

    @ValidateNested({ each: true })
    @Type(() => RoomType)
    public roomTypes: Map<string, RoomType[]>;

    @IsNotEmpty()
    @IsEnum(AccommodationType)
    public type: AccommodationType;
}
