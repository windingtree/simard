import staticPriceClassDescriptions from './static_product_descriptions.json';

/**
 * Map cabin/class name (e.g. Economy flexible) to a list of amenities included in that product
 */
export function getStaticCabinTypeDescriptions(carrierCode: string, cabinTypeName: string): string[] {
    const description = [];
    if (staticPriceClassDescriptions[carrierCode] &&
        staticPriceClassDescriptions[carrierCode].cabins &&
        staticPriceClassDescriptions[carrierCode].cabins[cabinTypeName]) {
            description.push(...staticPriceClassDescriptions[carrierCode].cabins[cabinTypeName]);
    }
    return description;
}

/**
 * Map ancillary service name (e.g. Corporate Preferred Elite) to a list of amenities included in that product
 */
export function getStaticServiceDescriptions(carrierCode: string, serviceName: string): string[] {
    const description = [];
    if (staticPriceClassDescriptions[carrierCode] &&
        staticPriceClassDescriptions[carrierCode].services &&
        staticPriceClassDescriptions[carrierCode].services[serviceName]) {
        description.push(...staticPriceClassDescriptions[carrierCode].services[serviceName]);
    }
    return description;
}

/**
 * Map marketing seat name (e.g. Main Cabin Extra) to a list of amenities included in that product
 */
export function getStaticSeatDescriptions(carrierCode: string, seatTypeName: string): string[] {
    const description = [];
    if (staticPriceClassDescriptions[carrierCode] &&
        staticPriceClassDescriptions[carrierCode].seats &&
        staticPriceClassDescriptions[carrierCode].seats[seatTypeName]) {
        description.push(...staticPriceClassDescriptions[carrierCode].seats[seatTypeName]);
    }
    return description;
}
