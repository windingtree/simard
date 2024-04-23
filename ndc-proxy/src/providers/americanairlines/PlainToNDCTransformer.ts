import 'reflect-metadata';
import {NDCAirShoppingResponse, NDCOfferPriceResponse} from '../../interfaces/ndc';
import {plainToClass} from 'class-transformer';
import {NDCOrderCreateResponse} from '../../interfaces/ndc';
import {NDCSeatAvailabilityResponse} from '../../interfaces/ndc';
import { NDCOrderRetrievalResponse } from '../../interfaces/ndc/order/NDCOrderRetrievalResponse';

export class PlainToNDCTransformer {
    public static transformAirShoppingRS(rawResponse: any): NDCAirShoppingResponse {
        return plainToClass(NDCAirShoppingResponse, rawResponse);
    }

    public static transformOfferPriceRS(rawResponse: any): NDCOfferPriceResponse {
        return plainToClass(NDCOfferPriceResponse, rawResponse);
    }

    public static transformOrderCreateRS(rawResponse: any): NDCOrderCreateResponse {
        return plainToClass(NDCOrderCreateResponse, rawResponse);
    }

    public static transformSeatAvailRS(rawResponse: any): NDCSeatAvailabilityResponse {
        return plainToClass(NDCSeatAvailabilityResponse, rawResponse);
    }

    public static transformOrderRetrieveRS(rawResponse: any): NDCOrderRetrievalResponse {
        return plainToClass(NDCOrderRetrievalResponse, rawResponse);
    }
}
