import {loadSampleFile} from '../../testUtils';
import {
    NDCAirShoppingRS, NDCPassenger, NDCPassengerType
} from '../../../../../../src/interfaces/ndc';
import {buildOfferPriceRQ} from '../../../../../../src/providers/americanairlines/converters/offerprice';
import {processAirShoppingRS} from '../../../../../../src/providers/americanairlines/converters/airshopping';
import {env} from '../../../../../../src/env';

const pax1: NDCPassenger = {
    PassengerID: 'pax1',
    type: NDCPassengerType.ADT,
    GivenName: 'John',
    Surname: 'Doe',
    Birthdate: '2000-01-01',
    ContactInformation: {
        PhoneNumber: '+1 123123123123',
        EmailAddress: 'test@test.com',
    }};
const pax2: NDCPassenger = {
    PassengerID: 'pax2',
    type: NDCPassengerType.ADT,
    GivenName: 'Frank',
    Surname: 'Doe',
    Birthdate: '2000-01-01',
    ContactInformation: {
        PhoneNumber: '+1 123123123123',
        EmailAddress: 'test@test.com',
    },
};
const pax3: NDCPassenger = {
    PassengerID: 'pax3',
    type: NDCPassengerType.CNN,
    GivenName: 'Andy',
    Surname: 'Doe',
    Birthdate: '2016-01-01',
    ContactInformation: {
        PhoneNumber: '+1 123123123123',
        EmailAddress: 'test@test.com',

    },
};

describe('OfferPriceRQBuilder.ts', () => {
    it('should create OfferPriceRQ SOAP message based on offer received from AirShopping', async (done) => {
        // load saved AirShopping response (XML) and transform it to JSON
        const shoppingResponseXML = await loadSampleFile('AirShoppingRS_JFKDFW_1ADT_1CNN_OneWay.xml');
        const airShoppingRS: NDCAirShoppingRS = (await processAirShoppingRS(shoppingResponseXML)).AirShoppingRS;
        // take 1st offer
        const offer = airShoppingRS.AirlineOffers[0];
        const passengers = [pax1, pax2, pax3];
        // build request
        const request = buildOfferPriceRQ(env.AA_BUSINESS, passengers, offer, airShoppingRS.ShoppingResponseID.ResponseID, airShoppingRS.TransactionIdentifier);
        // await writeSampleFile('OfferPriceRQ_JFKDFW_1ADT_1CNN_OneWay.xml', request);
        // dummy check, it would be better to parse XML and check but ....
        const expectedXML = await loadSampleFile('OfferPriceRQ_JFKDFW_1ADT_1CNN_OneWay.xml');
        expect(request).not.toBeUndefined();
        expect(request).toEqual(expectedXML);
        // TODO add more checks
        done();
    });

});
