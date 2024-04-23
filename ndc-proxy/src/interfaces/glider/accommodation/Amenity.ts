import {IsNotEmpty, IsString} from 'class-validator';

export class Amenity {

    @IsString()
    public description: string;

    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsString()
    @IsNotEmpty()
    public otaCode: string;
}
