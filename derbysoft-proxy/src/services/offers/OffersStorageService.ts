import { Service } from "typedi";
// import { Offer, SearchResults } from "@simardwt/winding-tree-types";
import { FindManyOptions, MongoRepository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { getLogger } from "@simardwt/winding-tree-utils";
import { EOffer } from "@simardwt/winding-tree-utils";
import { HotelOTAError } from "../../types";
import { SearchResponse, Offer } from "@windingtree/glider-types/dist/accommodations";

@Service()
export class OffersStorageService {
  @InjectRepository(EOffer)
  private offersRepository: MongoRepository<EOffer>;
  private log = getLogger(__filename);

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
        expiration: { $gt: new Date() },
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

  public async assertOfferExists(offerId: string) {
    const query: FindManyOptions<EOffer> = {
      where: {
        offerID: offerId,
        expiration: { $gt: new Date() },
      },
    };
    const results = await this.offersRepository.find(query);

    if (!results || !results.length) {
      throw new HotelOTAError(`Offer with ID: '${offerId}' was not found or has expired`, 404);
    }
  }

  public async storeSearchResults(
    providerId: string,
    searchResults: SearchResponse
  ): Promise<EOffer[]> {
    const offers: EOffer[] = [];
    const offerIDs = Object.keys(searchResults.offers);
    await offerIDs.forEach(async (offerID) => {
      const offer = searchResults.offers[offerID];
      const offerRecord = await this.storeSearchResultsOffer(providerId, offerID, offer);
      offers.push(offerRecord);
    });
    return offers;
  }

  // TODO: change the storage format to store price as string.
  public async storeSearchResultsOffer(
    providerId: string,
    offerID: string,
    searchResultsOffer: Offer
  ): Promise<EOffer> {
    const record = new EOffer();
    record.offerID = offerID;
    record.expiration = new Date(searchResultsOffer.expiration);
    record.price = Number(searchResultsOffer.price.public);
    record.providerID = providerId;
    record.creationDate = new Date();
    const savedRec = await this.offersRepository.save(record);
    this.log.debug(
      "store offer:" +
        offerID +
        ", price:" +
        record.price +
        ", provider:" +
        record.providerID +
        ", objectID:" +
        record.id
    );
    return savedRec;
  }

  public async saveOfferEntity(offerID: string, record: EOffer): Promise<EOffer> {
    const result = await this.offersRepository.save(record);
    this.log.debug(
      "store offer:" +
        offerID +
        ", price:" +
        record.price +
        ", provider:" +
        record.providerID +
        ", objectID:" +
        record.id
    );
    return result;
  }
}
