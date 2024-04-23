import {loadSampleFile} from './testUtils';
import {processAirShoppingRS} from '../../../../src/providers/americanairlines/converters/airshopping';
import {NDCAirShoppingRS} from '../../../../src/interfaces/ndc';
import {SearchResultsBuilder} from '../../../../src/providers/americanairlines/SearchResultsBuilder';
import {
    PassengerType,
    SearchResults,
} from '../../../../src/interfaces/glider';
import {validateSearchResults} from '../../../testutils/validators';
import {createPassengerCriteria, createSearchCriteria, createSegmentCriteria} from '../../../testutils/fixtures';
import moment from 'moment';
import {env} from '../../../../src/env';

describe('SearchResultsBuilder', () => {
    it('should convert search results', async () => {
        // search criteria is needed to cross check results with request
        const searchCriteria = createSearchCriteria(
            [createSegmentCriteria('JFK', 'DFW', moment('2021-06-01').toDate())],
            [createPassengerCriteria(PassengerType.ADT), createPassengerCriteria(PassengerType.ADT), createPassengerCriteria(PassengerType.CHD)]);

        const soapResponse = await loadSampleFile('AirShoppingRS_JFKDFW_1ADT_1CNN_OneWay.xml');
        const airShoppingRS: NDCAirShoppingRS = (await processAirShoppingRS(soapResponse)).AirShoppingRS;

        const builder = new SearchResultsBuilder(env.AA_BUSINESS, airShoppingRS);
        const res: SearchResults = builder.build();
        expect(res).not.toBeUndefined();
        expect(res.passengers.size).toEqual(airShoppingRS.PassengerList.length);
        expect(res.itineraries.combinations.size).toEqual(airShoppingRS.FlightList.length);
        expect(res.itineraries.segments.size).toEqual(airShoppingRS.FlightSegmentList.length);
        expect(res.pricePlans.size).toEqual(airShoppingRS.PriceClassList.length);

        validateSearchResults(res, searchCriteria);
    });
});
