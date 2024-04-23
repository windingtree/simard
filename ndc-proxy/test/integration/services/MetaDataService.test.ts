import {Container} from 'typedi';
import {closeDatabase, createDatabaseConnection} from '../../testutils/database';

import {bootstrapDIContext} from '../../testutils/bootstrapDIContext';
import {MetaDataService} from '../../../src/services/providercontext/MetaDataService';
import {Connection} from 'typeorm';
import {generateUUID} from '../../../src/lib/uuid';
import {MetaDataRecord} from '../../../src/database/models/MetaDataRecord';

const provider_AmericanAirlines = 'AA';
const dataType_Offers = 'OFFERS';
const customData1 = {key1: 'value1'};
const identifiers_AA = [generateUUID(), generateUUID(), generateUUID()];

const provider_UnitedAirlines = 'UA';
const dataType_Orders = 'ORDERS';
const customData2 = {key2: 'value2'};
const identifiers_UA = [generateUUID(), generateUUID(), generateUUID()];

describe('MetaDataService', () => {

    let metaDataService: MetaDataService;
    let connection: Connection;
    // -------------------------------------------------------------------------
    // Setup up
    // -------------------------------------------------------------------------

    beforeAll(async () => {
        bootstrapDIContext();
        connection = await createDatabaseConnection();
        metaDataService = Container.get<MetaDataService>(MetaDataService);
    });

    // -------------------------------------------------------------------------
    // Tear down
    // -------------------------------------------------------------------------

    afterAll(() => closeDatabase(connection));

    // -------------------------------------------------------------------------
    // Test cases
    // -------------------------------------------------------------------------

    describe('#storeCustomData', () => {
        it('should store offerID related metadata and then retrieve it using "identifiers" parameter', async (done) => {
            // now store record_AA in the db and associate it with 3 identifiers_AA (specified as 'identifiers_AA' array)
            const record_AA: MetaDataRecord = await metaDataService.storeCustomData(provider_AmericanAirlines, dataType_Offers, identifiers_AA, customData1);
            expect(record_AA).not.toBeUndefined();
            expect(record_AA.contextId).toHaveLength(36);
            expect(record_AA.providerId).toEqual(provider_AmericanAirlines);
            expect(record_AA.dataType).toEqual(dataType_Offers);
            expect(record_AA.identifiers).toEqual(identifiers_AA);
            const contextId = record_AA.contextId; // this is unique ID of stored record_AA

            // also store second record (UA related)
            const record_UA: MetaDataRecord = await metaDataService.storeCustomData(provider_UnitedAirlines, dataType_Orders, identifiers_UA, customData2);
            expect(record_UA).not.toBeUndefined();
            expect(record_UA.contextId).toHaveLength(36);
            expect(record_UA.providerId).toEqual(provider_UnitedAirlines);
            expect(record_UA.dataType).toEqual(dataType_Orders);
            expect(record_UA.identifiers).toEqual(identifiers_UA);

            // now we try to find previously stored record_AA using one of identifiers_AA
            const firstId = identifiers_AA[0];
            let results = await metaDataService.findCustomDataById(provider_AmericanAirlines, dataType_Offers, [firstId]);
            expect(results).not.toBeUndefined();
            expect(results).toHaveLength(1);
            expect(results[0].contextId).toEqual(contextId);

            const secondId = identifiers_AA[1];
            // do the same as above but use second identifier - result should be same as previously
            results = await metaDataService.findCustomDataById(provider_AmericanAirlines, dataType_Offers, [secondId]);
            expect(results).not.toBeUndefined();
            expect(results).toHaveLength(1);
            expect(results[0].contextId).toEqual(contextId);

            // now, let's search but provide both identifiers_AA as params - result should be same as previously
            results = await metaDataService.findCustomDataById(provider_AmericanAirlines, dataType_Offers, [secondId, firstId]);
            expect(results).not.toBeUndefined();
            expect(results).toHaveLength(1);
            expect(results[0].contextId).toEqual(contextId);

            // now let's try to find previously stored record_AA using contextID
            results = await metaDataService.findCustomDataByContextId(contextId);
            expect(results).not.toBeUndefined();
            expect(results).toHaveLength(1);
            expect(results[0].contextId).toEqual(contextId);

            // now let's make sure that searching with dummy or empty params does not return any data
            // search using fake or empty providerID
            results = await metaDataService.findCustomDataById('fake-provider-id', dataType_Offers, [firstId]);
            expect(results).toHaveLength(0);

            results = await metaDataService.findCustomDataById(undefined, dataType_Offers, [firstId]);
            expect(results).toHaveLength(0);


            // search using fake or empty dataType
            results = await metaDataService.findCustomDataById(provider_AmericanAirlines, 'fake-datatype', [firstId]);
            expect(results).toHaveLength(0);

            // search using fake or empty dataType
            results = await metaDataService.findCustomDataById(provider_AmericanAirlines, undefined, [firstId]);
            expect(results).toHaveLength(0);

            // search using fake or empty IDs
            results = await metaDataService.findCustomDataById(provider_AmericanAirlines, dataType_Offers, []);
            expect(results).toHaveLength(0);
            results = await metaDataService.findCustomDataById(provider_AmericanAirlines, dataType_Offers, undefined);
            expect(results).toHaveLength(0);
            results = await metaDataService.findCustomDataById(provider_AmericanAirlines, dataType_Offers, ['dummy-id']);
            expect(results).toHaveLength(0);

            done();
        });

    });
});
