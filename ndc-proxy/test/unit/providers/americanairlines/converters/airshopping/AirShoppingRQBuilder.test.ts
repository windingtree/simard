import {loadSampleFile} from '../../testUtils';
import {
    NDCItineraryCriteria,
    NDCPassenger,
} from '../../../../../../src/interfaces/ndc';
import {buildAirShoppingRQ} from '../../../../../../src/providers/americanairlines/converters/airshopping';
import {env} from '../../../../../../src/env';

const itinJFKDFW: NDCItineraryCriteria = {
    odKey: 'OD1',
    origin: 'JFK',
    destination: 'DFW',
    travelDate: '2021-06-01',
};

const pax1: NDCPassenger = {
    PassengerID: 'pax1',
    type: 'ADT',
    GivenName: 'John',
    Surname: 'Doe',
    Birthdate: '2000-01-01',
    ContactInformation: {
        PhoneNumber: '+1 123123123123',
        EmailAddress: 'test@test.com',
    },
};

describe('AirShoppingRQBuilder', () => {
    it('should create AirShoppingRQ SOAP message from search criteria', async (done) => {
        const soapMessage = buildAirShoppingRQ(env.AA_BUSINESS, [pax1], [itinJFKDFW], 'abc');
        expect(soapMessage).not.toBeUndefined();
        // await writeSampleFile(`AirShoppingRQ_JFKDFW_1ADT_1CNN_OneWay.xml`, soapMessage);
        const expectedXML = await loadSampleFile('AirShoppingRQ_JFKDFW_1ADT_1CNN_OneWay.xml');
        expect(soapMessage).toEqual(expectedXML);
        done();
    });
});
