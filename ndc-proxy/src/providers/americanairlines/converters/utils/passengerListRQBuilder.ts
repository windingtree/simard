import {NDCPostalAddress, NDCPassenger, NDCPassengerType} from '../../../../interfaces/ndc';
import {FarelogixConfiguration} from '../../../../env';

export function passengerListRQBuilder(config: FarelogixConfiguration, passengers: NDCPassenger[], addPassengerNames: boolean = true, addContactDetails: boolean = false, addFrequentTraveler: boolean = true, addCorporateTraveler: boolean = true): string {
    const passengersListStr = `<PassengerList>
    ${passengers.map(passenger => {
        const passengerContactElement = formatPassengerContactElement(passenger);
        return `<Passenger PassengerID="${passenger.PassengerID}">
            <PTC>${passenger.type}</PTC>
            ${addPassengerNames ? formatPassengerDetails(passenger) : ''}
            ${addFrequentTraveler ? formatLoyaltyProgramAccountListElement(passenger) : ''}
            ${addCorporateTraveler ? formatCorporateTravelerAccountElement(config) : ''}
            ${addContactDetails && passengerContactElement.length > 0 ? formatPassengerContactReferenceElement(passenger) : ''}
            ${passenger.InfantRef && passenger.InfantRef.length > 0 ? `<InfantRef>${passenger.InfantRef}</InfantRef>` : ''}
        </Passenger>`; }).join('\n')}
    </PassengerList>`;
    return `${passengersListStr}
    ${addContactDetails ? formatContactListElement(passengers) : ''}`;
}

export function passengerListRQBuilderOrderCreate(config: FarelogixConfiguration, passengers: NDCPassenger[], addContactDetails: boolean = false, addFrequentTraveler: boolean = true, addCorporateTraveler: boolean = true): string {
    const configOrderCreate: FarelogixConfiguration = Object.assign({}, config);
    if (config.providerID === 'AABUSINESS') {
        configOrderCreate.corporateCode = `C${configOrderCreate.corporateCode}`;
    }
    const passengersListStr = `<PassengerList>
    ${passengers.map(passenger => {
        const passengerContactElement = formatPassengerContactElement(passenger);
        return `<Passenger PassengerID="${passenger.PassengerID}">
            <PTC>${passenger.type}</PTC>
            ${formatPassengerDetails(passenger)}
            ${addFrequentTraveler ? formatLoyaltyProgramAccountListElement(passenger) : ''}
            ${addCorporateTraveler ? formatCorporateTravelerAccountElement(configOrderCreate) : ''}
            ${addContactDetails && passengerContactElement.length > 0 ? formatPassengerContactReferenceElement(passenger) : ''}
            ${passenger.InfantRef && passenger.InfantRef.length > 0 ? `<InfantRef>${passenger.InfantRef}</InfantRef>` : ''}
        </Passenger>`; }).join('\n')}
    </PassengerList>`;
    return `${passengersListStr}
    ${addContactDetails ? formatContactListElement(passengers) : ''}`;
}

/**
 * Format <Individual> element which contains passengers personal details.
 * If no personal details is provided it will return empty string
 */
function formatPassengerDetails(passenger: NDCPassenger): string {
    const subElements = [];
    if (passenger.Birthdate) { subElements.push(`<Birthdate>${passenger.Birthdate}</Birthdate>`)  ; }
    if (passenger.Gender) { subElements.push(`<Gender>${passenger.Gender}</Gender>`)  ; }
    // UA does not support name titles for infants
    if (passenger.NameTitle && passenger.type !== NDCPassengerType.INF) { subElements.push(`<NameTitle>${passenger.NameTitle}</NameTitle>`)  ; }
    if (passenger.GivenName) { subElements.push(`<GivenName>${passenger.GivenName}</GivenName>`)  ; }
    if (passenger.Middlename) { subElements.push(`<MiddleName>${passenger.Middlename}</MiddleName>`)  ; }
    if (passenger.Surname) { subElements.push(`<Surname>${passenger.Surname}</Surname>`)  ; }
    if (subElements.length > 0) {
        return `<Individual>${subElements.join('\n')}</Individual>`;
    } else {
        return '';
    }
}

/**
 * Create corporate traveler details (to get price discounts), requires agreement with an airline
 */
const formatCorporateTravelerAccountElement = (config: FarelogixConfiguration): string => {
    if (config.corporateCode && config.corporateCode.length > 0) {
        return `<LoyaltyProgramAccount>
                <Airline>
                    <AirlineDesignator>${config.airlineCode}</AirlineDesignator>
                </Airline>
                <ProgramName>CLID</ProgramName>
                <AccountNumber>${config.corporateCode}</AccountNumber>
            </LoyaltyProgramAccount>`;
    } else {
        return '';
    }
};
/**
 * Create frequent traveler details for a given passenger
 * @param passenger
 */
const formatLoyaltyProgramAccountListElement = (passenger: NDCPassenger): string => {
    const {LoyaltyPrograms} = passenger;
    if (LoyaltyPrograms && Array.isArray(LoyaltyPrograms) && LoyaltyPrograms.length > 0) {
        const data = LoyaltyPrograms.map(frequentFlier => {
            return `<LoyaltyProgramAccount>
                <Airline>
                    <AirlineDesignator>${frequentFlier.airlineDesignator}</AirlineDesignator>
                </Airline>
                <AccountNumber>${frequentFlier.number}</AccountNumber>
            </LoyaltyProgramAccount>`;
        });
        return data.join('');
    } else {
        return '';
    }
};

function createPassengerContactRefID(passenger: NDCPassenger): string {
    return `${passenger.PassengerID}CI`;
}

function formatPassengerContactReferenceElement(passenger: NDCPassenger): string {
    return `<ContactInfoRef>${createPassengerContactRefID(passenger)}</ContactInfoRef>`;
}

function formatContactListElement(passengers: NDCPassenger[]): string {
    const subElements = [];
    passengers.forEach(passenger => {
        const contactElement = formatPassengerContactElement(passenger);
        if (contactElement && contactElement.length > 0) {
            subElements.push(contactElement);
        }
    });
    if (subElements.length > 0) {
        return `<ContactList>${subElements.join('\n')}</ContactList>`;
    } else {
        return '';
    }

}
function formatPassengerContactElement(passenger: NDCPassenger): string {
    const contactInformation = passenger.ContactInformation;
    if (!contactInformation) {
        return '';
    }
    const addressElement = formatPostalAddressElement(contactInformation.PostalAddress);
    const emailElement = formatEmailContactElement(contactInformation.EmailAddress);
    const phoneElement = formatPhoneContactElement(contactInformation.PhoneNumber);
    const subElements = [];
    if (addressElement && addressElement.length > 0) { subElements.push(addressElement); }
    if (phoneElement && phoneElement.length > 0) { subElements.push(phoneElement); }
    if (emailElement && emailElement.length > 0) { subElements.push(emailElement); }
    if (subElements.length > 0) {
        return `<ContactInformation ContactID="${passenger.PassengerID}CI">${subElements.join('\n')}</ContactInformation>`;
    } else {
        return '';
    }
}
function formatPostalAddressElement(address: NDCPostalAddress): string {
    const subElements = [];
    if (address && address.Street) { subElements.push(`<Street>${address.Street}</Street>`); }
    if (address && address.PostalCode) { subElements.push(`<PostalCode>${address.PostalCode}</PostalCode>`); }
    if (address && address.CityName) { subElements.push(`<CityName>${address.CityName}</CityName>`); }
    if (address && address.CountrySubdivisionName) {subElements.push(`<CountrySubdivisionName>${address.CountrySubdivisionName}</CountrySubdivisionName>`); }
    if (address && address.CountryCode) { subElements.push(`<CountryCode>${address.CountryCode}</CountryCode>`); }
    if (subElements.length > 0) {
        return `<PostalAddress>
            <Label>AddressAtDestination</Label>
            ${subElements.join('\n')}
        </PostalAddress>`;
    } else {
        return '';
    }

}

function formatPhoneContactElement(phone: string): string {
    if (phone && phone.length > 0) {
        return `<ContactProvided>
            <Phone>
                <Label>Home</Label>
                <CountryDialingCode>1</CountryDialingCode>
                <PhoneNumber>${phone}</PhoneNumber>
            </Phone>
        </ContactProvided>`;
    } else {
        return '';
    }
}

function formatEmailContactElement(email: string): string {
    if (email && email.length > 0) {
        return `<ContactProvided>
            <EmailAddress>
                <EmailAddressValue>${email}</EmailAddressValue>
            </EmailAddress>
        </ContactProvided>`;
    } else {
        return '';
    }
}
