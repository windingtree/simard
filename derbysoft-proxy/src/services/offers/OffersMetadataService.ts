import { getLogger, MetaDataRecord, MetaDataService } from "@simardwt/winding-tree-utils";
import Container, { Service } from "typedi";
import { SessionContext } from "../../types/shared/SessionContext";

enum MetadataType {
  SHOPPING = "SHOPPING",
  PRICING = "PRICING",
}

@Service()
export class OffersMetadataService {
  private log = getLogger(__filename);

  private get metadataService(): MetaDataService {
    return Container.get(MetaDataService);
  }

  public async saveShoppingMetadata<T>(
    providerID: string,
    context: SessionContext,
    shoppingOfferIDs: string[],
    shoppingResponse: T
  ): Promise<MetaDataRecord["contextId"]> {
    const record = await this.metadataService.storeCustomData(
      providerID,
      MetadataType.SHOPPING,
      [...Object.values(context), ...shoppingOfferIDs],
      shoppingResponse
    );

    return record.contextId;
  }

  public async saveOfferPriceMetadata<T>(
    providerID: string,
    context: SessionContext,
    pricedOfferIDs: string[],
    pricedOfferResponse: T
  ): Promise<MetaDataRecord["contextId"]> {
    const record = await this.metadataService.storeCustomData(
      providerID,
      MetadataType.PRICING,
      [...Object.values(context), ...pricedOfferIDs],
      pricedOfferResponse
    );

    return record.contextId;
  }

  private async findMetadata<T>(
    providerID: string,
    context: SessionContext,
    dataType: string,
    offerID: string
  ): Promise<T> {
    const metadataRecords: MetaDataRecord[] =
      // TODO: the db query is returning records if only one element of the array
      // is matching, this is not what we want, so I removed context for now
      await this.metadataService.findCustomDataById(providerID, dataType, [
        // ...Object.values(context),
        offerID,
      ]);
    if (!Array.isArray(metadataRecords) || metadataRecords.length === 0) {
      this.log.error(
        `findMetadata, could not find metadata, provider:${providerID}, offerID:${offerID}`
      );
      throw new Error(`Could not find offer ${offerID}`);
    }
    if (metadataRecords.length > 1) {
      this.log.warn(`More than 1 shopping metadata record found for offerID:${offerID}`);
    }
    return metadataRecords[0].customData as T;
  }

  public async findShoppingMetadata<T>(
    providerID: string,
    context: SessionContext,
    shoppingOfferID: string
  ): Promise<T> {
    return await this.findMetadata<T>(providerID, context, MetadataType.SHOPPING, shoppingOfferID);
  }

  public async findPricingMetadata<T>(
    providerID: string,
    context: SessionContext,
    pricedOfferID: string
  ): Promise<T> {
    return await this.findMetadata<T>(providerID, context, MetadataType.PRICING, pricedOfferID);
  }
}
