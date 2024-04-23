import {Service} from 'typedi';
import {OffersRepository} from '../../database/repositories/OffersRepository';
import {EOffer} from '../../database/models/EOffer';
import {Offer, SearchResults} from '../../interfaces/glider';
import {OrmRepository} from 'typeorm-typedi-extensions';
import {FindManyOptions} from 'typeorm';
import {LoggerFactory} from '../../lib/logger';

@Service()
export class OffersStorageService {

    @OrmRepository()
    private offersRepository: OffersRepository;

    private log = LoggerFactory.createLogger('offers service');

    /**
     * Find unexpired offer by offerID.
     * If offer is missing or expired, it will return undefined
     *
     * @param offerId
     */
    public async findOfferByOfferId(offerId: string): Promise<EOffer> {
        const query: FindManyOptions<EOffer> = {
            where: {
                offerID: offerId,
                expiration: {'$gt': new Date()},
            },
        };
        const results = await this.offersRepository.find(query);
        // TODO use mongo query to 'upsert' and return only the latest document, this is workaround now
        results.sort((a, b) => {
            if (a.creationDate.getMilliseconds() > b.creationDate.getMilliseconds()) {
                return -11;
            }
            if (a.creationDate.getMilliseconds() < b.creationDate.getMilliseconds()) {
                return 1;
            }
            return 0;
        });
        if (Array.isArray(results) && results.length > 0) {
            return results[0];
        }
        // TODO check if offer expired
        return undefined;
    }

    public async storeSearchResults<T>(providerId: string, searchResults: SearchResults): Promise<EOffer[]> {
        const offers: EOffer[]  = [];
        await searchResults.offers.forEach(async (offer, offerID) => {
            const offerRecord = await this.storeSearchResultsOffer(providerId, offerID, offer);
            offers.push(offerRecord);
        });
        return offers;
    }
    public async storeSearchResultsOffer<T>(providerId: string, offerID: string, searchResultsOffer: Offer): Promise<EOffer> {
        const record = new EOffer();
        record.offerID = offerID;
        record.expiration = searchResultsOffer.expiration;
        record.price = searchResultsOffer.price.public;
        record.currency = searchResultsOffer.price.currency;
        record.providerID = providerId;
        record.creationDate = new Date();
        const savedRec = await this.offersRepository.save(record);
        // this.log.debug('store offer:' + offerID + ', price:' + record.price + ', provider:' + record.providerID + ', objectID:' + record.id);
        return savedRec;
    }
    public async saveOfferEntity<T>(offerID: string, record: EOffer): Promise<EOffer> {
        const result = await this.offersRepository.save(record);
        this.log.debug('store offer:' + offerID + ', price:' + record.price + ', provider:' + record.providerID + ', objectID:' + record.id);
        return result;
    }
}
