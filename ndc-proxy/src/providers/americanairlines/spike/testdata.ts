import {
    NDCCardType,
    NDCFrequentFlyer,
    NDCItineraryCriteria,
    NDCPassenger,
    NDCPassengerGender, NDCPassengerType,
    NDCPaymentDetails
} from '../../../interfaces/ndc';
import {NDCPaymentType} from '../../../interfaces/ndc';

export const itinDFWHOU_0615: NDCItineraryCriteria = {
    odKey: 'OD1',
    origin: 'JFK',
    destination: 'LAX',
    travelDate: '2021-06-25',
};

export const itinHOUDFW_0619: NDCItineraryCriteria = {
    odKey: 'OD2',
    origin: 'HOU',
    destination: 'DFW',
    travelDate: '2021-06-19',
};

export const itinJFKDFW_0619: NDCItineraryCriteria = {
    odKey: 'OD3',
    origin: 'JFK',
    destination: 'DFW',
    travelDate: '2021-07-10',
};
export const itinDFWJFK_0719: NDCItineraryCriteria = {
    odKey: 'OD4',
    origin: 'DFW',
    destination: 'JFK',
    travelDate: '2021-07-19',
};

export const itinORDDFW_0908: NDCItineraryCriteria = {
    odKey: 'OD5',
    origin: 'ORD',
    destination: 'DFW',
    travelDate: '2021-09-08',
};

export const itinORDDFW_0922: NDCItineraryCriteria = {
    odKey: 'OD6',
    origin: 'DFW',
    destination: 'ORD',
    travelDate: '2021-09-22',
};

export const itinDFWLHR_0715: NDCItineraryCriteria = {
    odKey: 'OD7',
    origin: 'DFW',
    destination: 'LHR',
    travelDate: '2021-07-15',
};
export const itinLHRDFW_0725: NDCItineraryCriteria = {
    odKey: 'OD8',
    origin: 'LHR',
    destination: 'DFW',
    travelDate: '2021-07-25',
};

export const itinJFKMIA_0919: NDCItineraryCriteria = {
    odKey: 'OD9',
    origin: 'JFK',
    destination: 'MIA',
    travelDate: '2021-09-19',
};
export const pax1_ADT: NDCPassenger = {
    // Gender: NDCPassengerGender.Male,
    PassengerID: 'pax1',
    type: NDCPassengerType.ADT,
    GivenName: 'John',
    Surname: 'Doe',
    Birthdate: '1999-01-01',
    ContactInformation: {
        EmailAddress: '',
        PhoneNumber: '00123123123123',
    },
};
export const pax2_ADT: NDCPassenger = {
    Gender: NDCPassengerGender.Male,
    PassengerID: 'pax2',
    type: NDCPassengerType.ADT,
    GivenName: 'Frank',
    Surname: 'Doe',
    Birthdate: '2000-01-01',
    ContactInformation: {
        EmailAddress: 'username@host',
        PhoneNumber: '00123123123123',
    },
};
export const pax3_CNN: NDCPassenger = {
    Gender: NDCPassengerGender.Male,
    PassengerID: 'pax3',
    type: NDCPassengerType.CNN,
    GivenName: 'Andy',
    Surname: 'Doe',
    Birthdate: '2016-01-01',
    ContactInformation: {
        EmailAddress: 'username@host',
        PhoneNumber: '00123123123123',
    },
};

export const fop_VISA1: NDCPaymentDetails = {
    type: NDCPaymentType.CC,
    card: {
        cardCode: NDCCardType.VI,
        cardNumber: '4000020000000000',
        cardSeriesCode: '737',
        cardExpiryDate: '0330',
        cardHolderName: `${pax1_ADT.GivenName} ${pax1_ADT.Surname}`,
        billingAddressStreet: '123 STREET Billing',
        billingAddressCity: 'MIAMI',
        billingAddressState: 'FL',
        billingAddressPostal: '33160',
        billingAddressCountryCode: 'US',
    },
    amount: '0.00',
    currencyCode: 'USD',
};

export const fop_VISA2: NDCPaymentDetails = {
    type: NDCPaymentType.CC,
    card: {
        cardCode: NDCCardType.VI,
        cardNumber: '4035501000000008',
        cardSeriesCode: '737',
        cardExpiryDate: '0330',
        cardHolderName: `${pax1_ADT.GivenName} ${pax1_ADT.Surname}`,
        billingAddressStreet: '123 STREET Billing',
        billingAddressCity: 'MIAMI',
        billingAddressState: 'FL',
        billingAddressPostal: '33160',
        billingAddressCountryCode: 'US',
    },
    amount: '0.00',
    currencyCode: 'USD',
};

export const fop_MASTERCARD: NDCPaymentDetails = {
    type: NDCPaymentType.CC,
    card: {
        cardCode: NDCCardType.CA,
        cardNumber: '5136333333333335',
        cardSeriesCode: '737',
        cardExpiryDate: '0330',
        cardHolderName: `${pax1_ADT.GivenName} ${pax1_ADT.Surname}`,
        billingAddressStreet: '123 STREET Billing',
        billingAddressCity: 'MIAMI',
        billingAddressState: 'FL',
        billingAddressPostal: '33160',
        billingAddressCountryCode: 'US',
    },
    amount: '0.00',
    currencyCode: 'USD',
};

export const fop_AMEX: NDCPaymentDetails = {
    type: NDCPaymentType.CC,
    card: {
        cardCode: NDCCardType.AX,
        cardNumber: '370000000000002',
        cardSeriesCode: '7373',
        cardExpiryDate: '0330',
        cardHolderName: `${pax1_ADT.GivenName} ${pax1_ADT.Surname}`,
        billingAddressStreet: '123 STREET Billing',
        billingAddressCity: 'MIAMI',
        billingAddressState: 'FL',
        billingAddressPostal: '33160',
        billingAddressCountryCode: 'US',
    },
    amount: '0.00',
    currencyCode: 'USD',
};

export const ff_ExecutivePlatinum: NDCFrequentFlyer = {
    number: '6H020M0',
    airlineDesignator: 'AA',
};

export const ff_PlatinumPro: NDCFrequentFlyer = {
    number: 'L816W08',
    airlineDesignator: 'AA',
};

export const ff_Platinum: NDCFrequentFlyer = {
    number: '43KXJ60',
    airlineDesignator: 'AA',
};
export const ff_Gold: NDCFrequentFlyer = {
    number: '96F4W22',
    airlineDesignator: 'AA',
};

export const ff_Regular: NDCFrequentFlyer = {
    number: 'F172M02',
    airlineDesignator: 'AA',
};
