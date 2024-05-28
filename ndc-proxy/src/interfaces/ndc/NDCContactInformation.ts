import {Type} from 'class-transformer';

export class NDCPostalAddress {
    public Label: string;
    public Street: string;
    public PostalCode: string;
    public CityName: string;
    public CountrySubdivisionName: string;
    public CountryName: string;
    public CountryCode: string;
}

export class NDCPhone {
    public Label: string;
    public PhoneNumber: string;
}

export class NDCEmailAddress {
    public EmailAddressValue: string;
}

export class NDCContactInformationProvided {
    public ContactID: string;
    public EmailAddresses?: NDCEmailAddress[];
    public Phones?: NDCPhone[];
}

export class NDCContactInformation {
    @Type(() => NDCPostalAddress)
    public PostalAddress?: NDCPostalAddress;
    public PhoneNumber?: string;
    public EmailAddress?: string;
}

/*
<PostalAddress>
    <Label>AddressAtDestination</Label>
    <Street>5TH AVENUE</Street>
    <PostalCode>33160</PostalCode>
    <CityName>MIAMI</CityName>
    <CountrySubdivisionName>FL</CountrySubdivisionName>
    <CountryName>United States</CountryName>
    <CountryCode>US</CountryCode>
</PostalAddress>

<Phone>
    <Label>Other</Label>
    <PhoneNumber>2312312312</PhoneNumber>
</Phone>

<EmailAddress>
    <EmailAddressValue>username@host</EmailAddressValue>
</EmailAddress>

 */
