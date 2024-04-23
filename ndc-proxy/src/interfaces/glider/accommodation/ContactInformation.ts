import {Address} from './Address';
import {IsArray, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';

export class ContactInformation {
    @ValidateNested()
    @Type(() => Address)
    public address: Address;

    @IsArray()
    public emails: string[];

    @IsArray()
    public phoneNumbers: string[];
}
