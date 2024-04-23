import {NDCOfferPriceResponse} from '../../../interfaces/ndc';
import {Mapping} from '../../../lib/uuid';
import {OptionSelectionCriteria} from '../../../interfaces/glider';

export interface PricingMetadataContainer {
    mapping: Mapping;
    pricingResponse: NDCOfferPriceResponse;
    shoppingOfferIDs: string[];
    optionSelection: OptionSelectionCriteria[];
}
