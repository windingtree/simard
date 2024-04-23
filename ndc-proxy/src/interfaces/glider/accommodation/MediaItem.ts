import {MediaType} from './MediaType';
import {IsEnum, IsNotEmpty, IsNumber, IsString, IsUrl} from 'class-validator';

export class MediaItem {

    @IsNumber()
    public height: number;

    @IsNotEmpty()
    @IsEnum(MediaType)
    public type: MediaType;

    @IsString()
    @IsUrl()
    public url: string;

    @IsNumber()
    public width: number;
}
