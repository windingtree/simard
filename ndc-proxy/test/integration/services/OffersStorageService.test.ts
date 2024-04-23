import {Container} from 'typedi';
import {closeDatabase, createDatabaseConnection} from '../../testutils/database';

import {bootstrapDIContext} from '../../testutils/bootstrapDIContext';
import {Connection} from 'typeorm';
import {generateUUID} from '../../../src/lib/uuid';
import {OffersStorageService} from '../../../src/services/offers/OffersStorageService';
import moment from 'moment';
import {ExtendedPriceDetails, Offer} from '../../../src/interfaces/glider';

describe('OffersStorageService', () => {

    const expiryInFuture = moment().add(1, 'hour').toDate();
    const expiryInPast = moment().add(-11, 'hour').toDate();

    let offersStorageService: OffersStorageService;
    let connection: Connection;
    // -------------------------------------------------------------------------
    // Setup up
    // -------------------------------------------------------------------------

    beforeAll(async () => {
        bootstrapDIContext();
        connection = await createDatabaseConnection();
        offersStorageService = Container.get<OffersStorageService>(OffersStorageService);
    });

    // -------------------------------------------------------------------------
    // Tear down
    // -------------------------------------------------------------------------

    afterAll(() => closeDatabase(connection));

    // -------------------------------------------------------------------------
    // Test cases
    // -------------------------------------------------------------------------

    describe('#storeSearchResultsOffer', () => {
        it('should store offer in a database and retrieve if by offerID if offer expiry date is in the future', async (done) => {
            const searchOffer: Offer = buildSearcOffer(123, expiryInFuture);
            const offerID = generateUUID();
            const storedRecord = await offersStorageService.storeSearchResultsOffer('AA', offerID, searchOffer);
            expect(storedRecord).not.toBeUndefined();
            expect(storedRecord.offerID).toEqual(offerID);
            expect(storedRecord.providerID).toEqual('AA');
            expect(storedRecord.expiration).toEqual(searchOffer.expiration);
            expect(storedRecord.price).toEqual(searchOffer.price.public);

            const foundOffer = await offersStorageService.findOfferByOfferId(offerID);
            expect(foundOffer).not.toBeUndefined();
            expect(foundOffer.offerID).toEqual(storedRecord.offerID);
            expect(foundOffer.expiration).toEqual(storedRecord.expiration);
            expect(foundOffer.price).toEqual(storedRecord.price);
            done();
        });

        it('upsert correctly (override existing offerID if it saved once again)', async (done) => {
            const offerPrice123: Offer = buildSearcOffer(123, expiryInFuture);
            const offerID = generateUUID();
            await offersStorageService.storeSearchResultsOffer('AA', offerID, offerPrice123);
            let foundOffer = await offersStorageService.findOfferByOfferId(offerID);
            expect(foundOffer.offerID).toEqual(offerID);
            expect(foundOffer.price).toEqual(123);

            // now create another offer record with THE SAME OFFER ID but different price
            // expectation is that the new record will overwrite the previous one
            const offerPrice555: Offer = buildSearcOffer(555, expiryInFuture);
            await offersStorageService.storeSearchResultsOffer('AA', offerID, offerPrice555);
            foundOffer = await offersStorageService.findOfferByOfferId(offerID);
            expect(foundOffer.offerID).toEqual(offerID);
            expect(foundOffer.price).toEqual(555);
            done();
        });
    });
        describe('#findOfferByOfferId', () => {

        it('should store offer in a database but return null when offer expiry date is in the past', async (done) => {
            const searchOffer: Offer = buildSearcOffer(123, expiryInPast);  // expiry date in the past
            const offerID = generateUUID();
            const storedRecord = await offersStorageService.storeSearchResultsOffer('AA', offerID, searchOffer);
            expect(storedRecord).not.toBeUndefined();
            expect(storedRecord.offerID).toEqual(offerID);
            const foundOffer = await offersStorageService.findOfferByOfferId(offerID);
            expect(foundOffer).toBeUndefined();
            done();
        });

        it('should store offer in a database but return null when offer expiry date is in the past', async (done) => {
            const foundOffer = await offersStorageService.findOfferByOfferId('non-existient-offerID');
            expect(foundOffer).toBeUndefined();
            done();
        });

    });
});

const buildSearcOffer = (price: number, expiration: Date): Offer => {
    const dummyPrice = new ExtendedPriceDetails(price, 'EUR', 0, 0);
    return new Offer({expiration, price: dummyPrice, pricePlansReferences: undefined, provider:'XX'});
};
