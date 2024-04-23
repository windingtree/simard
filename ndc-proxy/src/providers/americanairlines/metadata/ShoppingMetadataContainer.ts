import {NDCAirShoppingResponse} from '../../../interfaces/ndc';
import {Mapping} from '../../../lib/uuid';

export interface ShoppingMetadataContainer {
    mapping: Mapping;
    shoppingResponse: NDCAirShoppingResponse;
}
