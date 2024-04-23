import {IsString} from 'class-validator';

export class Address {
    @IsString()
    public country: string;

    @IsString()
    public locality: string;

    @IsString()
    public postalCode: string;

    @IsString()
    public premise: string;

    @IsString()
    public streetAddress: string;
}
