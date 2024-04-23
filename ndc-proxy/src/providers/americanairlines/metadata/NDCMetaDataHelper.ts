import {Service} from 'typedi';
import {MetaDataService} from '../../../services/providercontext/MetaDataService';
import {LoggerFactory} from '../../../lib/logger';
import {NDCAirShoppingResponse, NDCAirShoppingRS, NDCOffer, NDCOfferPriceResponse} from '../../../interfaces/ndc';
import {UUIDMapper} from '../../../lib/uuid';
import {ShoppingMetadataContainer} from './ShoppingMetadataContainer';
import {MetaDataRecord} from '../../../database/models/MetaDataRecord';
import {PricingMetadataContainer} from './PricingMetadataContainer';
import {NDCSeatAvailabilityResponse} from '../../../interfaces/ndc';
import {SeatMapMetadataContainer} from './SeatMapMetadataContainer';
import {OptionSelectionCriteria} from '../../../interfaces/glider';

enum MetadataType {
    SHOPPING= 'SHOPPING',
    PRICING= 'PRICING',
    SEATMAP = 'SEATMAP',
}

@Service()
export class NDCMetaDataHelper {
    private log = LoggerFactory.createLogger('metadata service');
    constructor(
        private metadataService: MetaDataService) {
    }

    public async saveShoppingMetadata(providerID: string, gliderShoppingOfferIDs: string[], shoppingResponse: NDCAirShoppingResponse, mapper: UUIDMapper): Promise<ShoppingMetadataContainer> {
        const metadataContainer: ShoppingMetadataContainer = {
            mapping: mapper.serialize(),
            shoppingResponse,
        };
        this.log.debug(`saveShoppingMetadata, provider:${providerID}`);
        await this.metadataService.storeCustomData(providerID, MetadataType.SHOPPING, gliderShoppingOfferIDs, metadataContainer);
        return metadataContainer;
    }
    public async saveSeatmapMetadata(providerID: string, gliderShoppingOfferID: string, seatAvailRS: NDCSeatAvailabilityResponse, mapper: UUIDMapper): Promise<SeatMapMetadataContainer> {
        const metadataContainer: SeatMapMetadataContainer = {
            mapping: mapper.serialize(),
            seatMapResponse: seatAvailRS,
        };
        this.log.debug(`saveSeatmapMetadata, provider:${providerID}, gliderShoppingOfferID:${gliderShoppingOfferID}`);
        await this.metadataService.storeCustomData(providerID, MetadataType.SEATMAP, [gliderShoppingOfferID], metadataContainer);
        return metadataContainer;
    }

    public async savePricingMetadata(providerID: string, gliderPricedOfferID: string, pricingResponse: NDCOfferPriceResponse, mapper: UUIDMapper, gliderShoppingOfferIDs: string[], optionSelection: OptionSelectionCriteria[]): Promise<PricingMetadataContainer> {
        const metadataContainer: PricingMetadataContainer = {
            mapping: mapper.serialize(),
            pricingResponse,
            shoppingOfferIDs: gliderShoppingOfferIDs,
            optionSelection,
        };
        this.log.debug(`savePricingMetadata, provider:${providerID}, gliderPricedOfferID:${gliderPricedOfferID}`);
        await this.metadataService.storeCustomData(providerID, MetadataType.PRICING, [gliderPricedOfferID], metadataContainer);
        return metadataContainer;
    }

    public async findShoppingMetadata(providerID: string, gliderShoppingOfferID: string): Promise<ShoppingMetadataContainer> {
        // this.log.debug(`findShoppingMetadata, gliderShoppingOfferID:${gliderShoppingOfferID}`);
        return await this.findMetadata<ShoppingMetadataContainer>(providerID, MetadataType.SHOPPING, gliderShoppingOfferID);
    }

    public async findPricingMetadata(providerID: string, gliderPricedOfferID: string): Promise<PricingMetadataContainer> {
        // this.log.debug(`findPricingMetadata, gliderPricedOfferID:${gliderPricedOfferID}`);
        return await this.findMetadata<PricingMetadataContainer>(providerID, MetadataType.PRICING, gliderPricedOfferID);
    }
    public async findSeatMapMetadata(providerID: string, gliderShoppingOfferID: string): Promise<SeatMapMetadataContainer> {
        // this.log.debug(`findSeatMapMetadata, gliderOfferIDs:${gliderShoppingOfferID}`);
        return await this.findMetadata<SeatMapMetadataContainer>(providerID, MetadataType.SEATMAP, gliderShoppingOfferID);
    }

    public findNDCOffer(gliderOfferId: string, metadataContainer: ShoppingMetadataContainer): NDCOffer {
        const airShoppingRS: NDCAirShoppingRS = metadataContainer.shoppingResponse.AirShoppingRS;
        const uuidMapper = new UUIDMapper(metadataContainer.mapping);
        // get value(real offerID) that key === gliderOfferId from mapping
        let aaOfferId: string;

        try {
            aaOfferId = uuidMapper.reverse(gliderOfferId);
        } catch (error) {
            // give more intuitive error to end user here when mapping does not exist
            this.log.error((error as Error).message);
            throw new Error(`Could not find offer ${gliderOfferId} or offer has expired`);
        }

        const ndcOffer = airShoppingRS.AirlineOffers.find(offer => offer.OfferID === aaOfferId);
        if (!ndcOffer) {
            this.log.error(`Could not find NDCOffer for offerID:${gliderOfferId}, AA offerID:${aaOfferId}`);
            throw new Error(`Could not find offer ${gliderOfferId}`);
        }
        return ndcOffer;
    }

    private async findMetadata<T>(providerID: string, dataType: string, gliderOfferID: string): Promise<T> {
        const metadataRecords: MetaDataRecord[]  = await this.metadataService.findCustomDataById(providerID, dataType, [gliderOfferID]);
        if (!Array.isArray(metadataRecords) || metadataRecords.length === 0) {
            this.log.error(`findMetadata, could not find metadata, provider:${providerID}, gliderOfferID:${gliderOfferID}`);
            throw new Error(`Could not find offer ${gliderOfferID}`);
        }
        if (metadataRecords.length > 1) {
            this.log.warn(`More than 1 shopping metadata record found for offerID:${gliderOfferID}`);
        }
        return metadataRecords[0].customData as T;
    }

}
