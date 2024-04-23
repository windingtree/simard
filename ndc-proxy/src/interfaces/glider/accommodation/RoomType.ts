import {Amenity} from './Amenity';
import {Occupancy} from './Occupancy';
import {MediaItem} from './MediaItem';
import {IsNotEmpty, IsString, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {RoomSize} from './RoomSize';

export class RoomType {
    @ValidateNested({ each: true })
    @Type(() => Amenity)
    public amenities: Amenity[];

    @IsString()
    public description: string;

    @ValidateNested()
    @Type(() => Occupancy)
    public maximumOccupancy: Occupancy;

    @ValidateNested({ each: true })
    @Type(() => MediaItem)
    public media: MediaItem[];

    @IsString()
    @IsNotEmpty()
    public name: string;

    @ValidateNested()
    public policies: Map<string, string>;

    @ValidateNested()
    @Type(() => RoomSize)
    public size: RoomSize;

}
