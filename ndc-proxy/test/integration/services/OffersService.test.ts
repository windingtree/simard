describe('OffersService.ts', () => {
    describe('#searchOffers', () => {
        it('it should distribute a flight search call to all implementations of FlightProvider (e.g. AA, UA) and merge all offers into one response', async (done) => {
            fail('Not implemented');
        });
        it('in case non of FlightProvider return any data (no search results), return error to the client', async (done) => {
            fail('Not implemented');
        });
        it('in case one of FlightProviders fails to return data, /#earchOffers should return data from other FlightProviders ', async (done) => {
            fail('Not implemented');
        });
        it('If any FlightProvider takes too much time to complete, ignore that FlightProvider and collect data from other implementations that responded within max timeout time ', async (done) => {
            fail('Not implemented');
        });
    });

    describe('#priceOffers', () => {
        it('Once there is a request to price a given offer, it should find from which FlightProvider it came and make a pricing call only to that FlightProvider', async (done) => {
            fail('Not implemented');
        });
    });
});
