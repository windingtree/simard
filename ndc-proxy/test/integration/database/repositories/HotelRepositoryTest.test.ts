import { Container } from 'typedi';
import { Connection } from 'typeorm';

import {closeDatabase, createDatabaseConnection, migrateDatabase} from '../../../testutils/database';
import {configureLogger} from '../../../testutils/logger';
import {GeoLocationPoint, Hotel} from '../../../../src/database/models/Hotel';
import {HotelService} from '../../../../src/services/hotel/HotelService';

const hotels = [
    {
        address: 'Portobello\'s Pizzeria & Sicilian Kitchen, 83 Murray Street, New York, NY 10007, United States of America',
        name: 'Portobello',
        latlon: [40.715092122940966, -74.01081498399202],
    },
    {
        address: 'Holland Plaza Building, Canal Street, New York, NY 10005, United States of America',
        name: 'Holland',
        latlon: [40.723650561560504, -74.00791551604692],
    },
    {
        address: 'Arlo Soho, 231 Hudson Street, New York, NY 10013, United States of America',
        name: 'Arlo',
        latlon: [40.724370152090465, -74.00802816882555],
    },
    {
        address: 'Dogpound, 515 Canal Street, New York, NY 10013, United States of America',
        name: 'Dogpound',
        latlon: [40.72481735132471, -74.0090286327881],
    },

    {
        address: 'Yaya Tea Garden, 206 Grand Street, New York, NY 10013, United States of America',
        name: 'Yaya',
        latlon: [40.719174289823805, -73.99634178414766],
    },

    {
        address: 'Wawa, 602 North Black Horse Pike, Mount Ephraim, NJ 08059, United States of America',
        name: 'Wawa',
        latlon: [39.88680244957739, -75.08796866670076],
    },
];

describe('HotelRepository', () => {

    // -------------------------------------------------------------------------
    // Setup up
    // -------------------------------------------------------------------------

    let connection: Connection;
    beforeAll(async () => {
        configureLogger();
        connection = await createDatabaseConnection();
    });
    beforeEach(
        () => migrateDatabase(connection)
    );

    // -------------------------------------------------------------------------
    // Tear down
    // -------------------------------------------------------------------------

    afterAll(() => closeDatabase(connection));

    // -------------------------------------------------------------------------
    // Test cases
    // -------------------------------------------------------------------------

    test('should create a new pet in the database', async (done) => {
        const repo = Container.get<HotelService>(HotelService);

        for (const hotel of hotels) {
            const lat = hotel.latlon[0];
            const lon = hotel.latlon[1];
            const record = new Hotel(new GeoLocationPoint(lon, lat), hotel.name, hotel.address);
            await repo.save(record);
        }
        let results = await repo.findHotelsAtLocation({lat: 40.715092122940966, long: -74.01081498399202});
        expect(results.length).toBeGreaterThan(2);

        results = await repo.findHotelsAtLocation({lat: 39.88680244957739, long: -75.08796866670076});
        expect(results.length).toEqual(1);

        done();
    });

});
