import {NDCContactInformation} from './NDCContactInformation';
import {NDCFrequentFlyer} from './NDCFrequentFlyer';
import {Type} from 'class-transformer';

export class NDCPassenger {
    public PassengerID: string;
    public type: string;
    public GivenName?: string;
    public Surname?: string;
    public Middlename?: string;
    public Birthdate?: string;
    public Gender?: string;
    public NameTitle?: string;

    @Type(() => NDCContactInformation)
    public ContactInformation?: NDCContactInformation;

    @Type(() => NDCFrequentFlyer)
    public LoyaltyPrograms?: NDCFrequentFlyer[];

    public InfantRef?: string;
    public ContactInfoRef?: string;
}
