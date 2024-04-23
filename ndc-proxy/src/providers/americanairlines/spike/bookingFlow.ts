// tslint:disable-next-line:no-console
import 'reflect-metadata';
import {debugError} from '../utils/soap/debugError';
import {
    NDCAirShoppingRS,
    NDCAirShoppingResponse,
    NDCOfferPriceResponse, NDCOffer
} from '../../../interfaces/ndc';
import {
    itinHOUDFW_0619,
    itinDFWHOU_0615,
    pax1_ADT,
    fop_AMEX,
    pax2_ADT,
    ff_ExecutivePlatinum,
    fop_MASTERCARD,
    fop_VISA1,
    ff_PlatinumPro,
    itinJFKDFW_0619,
     itinDFWLHR_0715, itinLHRDFW_0725, itinJFKMIA_0919
} from './testdata';
import {NDCSeatAvailabilityResponse} from '../../../interfaces/ndc';
import {env, FarelogixConfiguration} from '../../../env';
import {FareLogixAirShoppingClient} from '../converters/FareLogixAirShoppingClient';
import {FareLogixPricingClient} from '../converters/FareLogixPricingClient';
import {FareLogixSeatMapClient} from '../converters/FareLogixSeatMapClient';
import {FareLogixOrderClient} from '../converters/FareLogixOrderClient';

const config: FarelogixConfiguration = env.AA_BUSINESS;
const flxAirShoppingClient = new FareLogixAirShoppingClient(config);
const flxAirPricingClient = new FareLogixPricingClient(config);
const flxSeatMapClient = new FareLogixSeatMapClient(config);
const flxOrderClient = new FareLogixOrderClient(config);

// @ts-ignore
async function domesticOW_2ADT_FFRegular_Amex(): Promise<void> {

    pax1_ADT.LoyaltyPrograms = [];
    const passengers = [pax1_ADT];
    const itineraries = [itinJFKDFW_0619];
    const fop = fop_AMEX;
        //////// SHOPPING //////////
        const airShoppingRSPayload: NDCAirShoppingResponse = await flxAirShoppingClient.searchForFlights(passengers, itineraries, config);
        let offer = findCheapestOffer(airShoppingRSPayload.AirShoppingRS);
        const shoppingResponseID = airShoppingRSPayload.AirShoppingRS.ShoppingResponseID.ResponseID;
        if (!offer) {
            throw new Error('No suitable offer found');
        }
        console.log('Offer that will be priced');

        //////// PRICING //////////
        const offerPriceRSPayload: NDCOfferPriceResponse = await flxAirPricingClient.offerPricing(shoppingResponseID, offer, passengers);

        //////// SEAT AVAILABILITY //////////
        const pricingResponseID = offerPriceRSPayload.OfferPriceRS.ShoppingResponseID.ResponseID;
        const offerForSeatAvailability = offerPriceRSPayload.OfferPriceRS.PricedOffer[0];
        const seatAvailResponse: NDCSeatAvailabilityResponse = await flxSeatMapClient.seatAvailability(pricingResponseID, offerForSeatAvailability, passengers, offerPriceRSPayload.OfferPriceRS);

        seatAvailResponse.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems.forEach(value => {
            console.log(`OfferItemID:${value.OfferItemID}, segment:${value.Eligibility.SegmentRefs}, pax:${value.Eligibility.PassengerRefs}`);
        });

 /*       //////// OPTIONAL SERVICES //////////
        await offers(pricingResponseID,offerForSeatAvailability,passengers);
*/
        //////// ORDER CREATE //////////
        offer = offerPriceRSPayload.OfferPriceRS.PricedOffer[0];    // take 1st offer
        // let pricingResponseID = offerPriceRSPayload.OfferPriceRS.ShoppingResponseID;
        await flxOrderClient.orderCreate(pricingResponseID, offer, passengers, fop, undefined);
}

// @ts-ignore
async function domesticRT_1ADT_FFGold_Visa(): Promise<void> {

    pax1_ADT.LoyaltyPrograms = [];
    // pax1_ADT.LoyaltyPrograms = [ff_ExecutivePlatinum];
    const passengers = [pax1_ADT];
    const itineraries = [itinJFKDFW_0619];
    const fop = fop_VISA1;

    //////// SHOPPING //////////
    const airShoppingRSPayload: NDCAirShoppingResponse = await flxAirShoppingClient.searchForFlights(passengers, itineraries, config);
    let offer = findCheapestOffer(airShoppingRSPayload.AirShoppingRS);
    // let offer = findOfferWithFlights(airShoppingRSPayload.AirShoppingRS)
    if (!offer) {
        throw new Error('No suitable offer found');
    }
    console.log('Offer that will be priced');

    const shoppingResponseID = airShoppingRSPayload.AirShoppingRS.ShoppingResponseID.ResponseID;

    //////// PRICING //////////
    const offerPriceRSPayload: NDCOfferPriceResponse = await flxAirPricingClient.offerPricing(shoppingResponseID, offer, passengers);

    //////// SEAT AVAILABILITY //////////
    const pricingResponseID = offerPriceRSPayload.OfferPriceRS.ShoppingResponseID.ResponseID;
    const offerForSeatAvailability = offerPriceRSPayload.OfferPriceRS.PricedOffer[0];
    const seatResponse: NDCSeatAvailabilityResponse = await flxSeatMapClient.seatAvailability(pricingResponseID, offerForSeatAvailability, passengers, offerPriceRSPayload.OfferPriceRS);
    displayChargeableSeats(seatResponse);

    /*       //////// OPTIONAL SERVICES //////////
           await offers(pricingResponseID,offerForSeatAvailability,passengers);
   */
    //////// ORDER CREATE //////////
    offer = offerPriceRSPayload.OfferPriceRS.PricedOffer[0];    // take 1st offer
    // let pricingResponseID = offerPriceRSPayload.OfferPriceRS.ShoppingResponseID;
    await flxOrderClient.orderCreate(pricingResponseID, offer, passengers, fop, undefined);
}

// @ts-ignore
async function domesticRT_2ADT_FFExecutive_Mastercard(): Promise<void> {

    pax1_ADT.LoyaltyPrograms = [ff_ExecutivePlatinum];
    const passengers = [pax1_ADT, pax2_ADT];
    const itineraries = [itinDFWHOU_0615, itinHOUDFW_0619];
    const fop = fop_MASTERCARD;

    //////// SHOPPING //////////
    const airShoppingRSPayload: NDCAirShoppingResponse = await flxAirShoppingClient.searchForFlights(passengers, itineraries, config);
    let offer = findCheapestOffer(airShoppingRSPayload.AirShoppingRS);
    const shoppingResponseID = airShoppingRSPayload.AirShoppingRS.ShoppingResponseID.ResponseID;
    if (!offer) {
        throw new Error('No suitable offer found');
    }
    console.log('Offer that will be priced');

    //////// PRICING //////////
    const offerPriceRSPayload: NDCOfferPriceResponse = await flxAirPricingClient.offerPricing(shoppingResponseID, offer, passengers);

    //////// SEAT AVAILABILITY //////////
    const pricingResponseID = offerPriceRSPayload.OfferPriceRS.ShoppingResponseID.ResponseID;
    const offerForSeatAvailability = offerPriceRSPayload.OfferPriceRS.PricedOffer[0];
    await flxSeatMapClient.seatAvailability(pricingResponseID, offerForSeatAvailability, passengers, offerPriceRSPayload.OfferPriceRS);

    /*       //////// OPTIONAL SERVICES //////////
           await offers(pricingResponseID,offerForSeatAvailability,passengers);
   */
    //////// ORDER CREATE //////////
    offer = offerPriceRSPayload.OfferPriceRS.PricedOffer[0];    // take 1st offer
    // let pricingResponseID = offerPriceRSPayload.OfferPriceRS.ShoppingResponseID;
    await flxOrderClient.orderCreate(pricingResponseID, offer, passengers, fop, undefined);
}

// @ts-ignore
async function internationalRT_2ADT_FFPlatinum_Mastercard(): Promise<void> {

    pax1_ADT.LoyaltyPrograms = [ff_PlatinumPro];
    const passengers = [pax1_ADT, pax2_ADT];
    const itineraries = [itinDFWLHR_0715, itinLHRDFW_0725];
    const fop = fop_MASTERCARD;

    //////// SHOPPING //////////
    const airShoppingRSPayload: NDCAirShoppingResponse = await flxAirShoppingClient.searchForFlights(passengers, itineraries, config);
    let offer = findCheapestOffer(airShoppingRSPayload.AirShoppingRS);
    const shoppingResponseID = airShoppingRSPayload.AirShoppingRS.ShoppingResponseID.ResponseID;
    if (!offer) {
        throw new Error('No suitable offer found');
    }
    console.log('Offer that will be priced');

    //////// PRICING //////////
    const offerPriceRSPayload: NDCOfferPriceResponse = await flxAirPricingClient.offerPricing(shoppingResponseID, offer, passengers);

    //////// SEAT AVAILABILITY //////////
    const pricingResponseID = offerPriceRSPayload.OfferPriceRS.ShoppingResponseID.ResponseID;
    const offerForSeatAvailability = offerPriceRSPayload.OfferPriceRS.PricedOffer[0];
    await flxSeatMapClient.seatAvailability(pricingResponseID, offerForSeatAvailability, passengers, offerPriceRSPayload.OfferPriceRS);

    /*       //////// OPTIONAL SERVICES //////////
           await offers(pricingResponseID,offerForSeatAvailability,passengers);
   */
    //////// ORDER CREATE //////////
    offer = offerPriceRSPayload.OfferPriceRS.PricedOffer[0];    // take 1st offer
    // let pricingResponseID = offerPriceRSPayload.OfferPriceRS.ShoppingResponseID;
    await flxOrderClient.orderCreate(pricingResponseID, offer, passengers, fop, undefined);
}

// @ts-ignore
async function domesticCodeShareOW_1ADT_FFRegular_Amex(): Promise<void> {

    pax1_ADT.LoyaltyPrograms = [];
    const passengers = [pax1_ADT];
    const itineraries = [itinJFKMIA_0919];
    const fop = fop_AMEX;

    //////// SHOPPING //////////
    const airShoppingRSPayload: NDCAirShoppingResponse = await flxAirShoppingClient.searchForFlights(passengers, itineraries, config);
    let offer = findCodeshareOffer(airShoppingRSPayload.AirShoppingRS);
    const shoppingResponseID = airShoppingRSPayload.AirShoppingRS.ShoppingResponseID.ResponseID;
    if (!offer) {
        throw new Error('No suitable offer found');
    }
    console.log('Offer that will be priced');

    //////// PRICING //////////
    const offerPriceRSPayload: NDCOfferPriceResponse = await flxAirPricingClient.offerPricing(shoppingResponseID, offer, passengers);
    const pricingResponseID = offerPriceRSPayload.OfferPriceRS.ShoppingResponseID.ResponseID;

    //////// ORDER CREATE //////////
    offer = offerPriceRSPayload.OfferPriceRS.PricedOffer[0];    // take 1st offer
    // let pricingResponseID = offerPriceRSPayload.OfferPriceRS.ShoppingResponseID;
    await flxOrderClient.orderCreate(pricingResponseID, offer, passengers, fop, undefined);
}

/*
// @ts-ignore
const isFlightForTest = (segment: NDCFlightSegment): boolean => {
    // const availableFlights = [328,1579,1429,1797, 2526,633,129,1991,2903,2359,2016,887, ]
    return segment.MarketingCarrier.FlightNumber === '328';
    // let flightNumber = parseInt(segment.MarketingCarrier.FlightNumber)
    // let result =  availableFlights.includes(flightNumber);
    // console.log('Flight ')
};
*/

/*
// @ts-ignore
const findOfferWithFlights = (response: airShoppingRSProcessor) => {
    for (let i = 0; i < response.AirlineOffers.length; i++) {
        const offer = response.AirlineOffers[i];
        const details = getOfferDetails(response, offer);
        let flightFound = false;
        details.forEach(detail => {
            detail.journeySegments.forEach(segment => {
                const isMatch = segment.MarketingCarrier.FlightNumber === '1579';
                if (isMatch) {
                    flightFound = true;
                }
            });
        });
        if (flightFound) {
            return offer;
        }
    }
    return undefined;
};
*/

const findCodeshareOffer = (response: NDCAirShoppingRS) => {

    const codeshareSegment = response.FlightSegmentList.find(segment => {return segment.OperatingCarrier && segment.OperatingCarrier.AirlineID !== 'AA'; });
    if (!codeshareSegment) {
        throw new Error('No codeshare segments');
    }
    const codeshareFlight = response.FlightList.find(flight => flight.SegmentReferences.split(' ').includes(codeshareSegment.SegmentKey));
    if (!codeshareFlight) {
        throw new Error('Cant find codeshareFlight with codeshare codeshareSegment, segmentKey:' + codeshareSegment.SegmentKey);
    }

    const codeshareOffer = response.AirlineOffers.find(offer => {
        return !!offer.FlightsOverview.find(fo => fo.FlightRef === codeshareFlight.FlightKey);
    });
    if (!codeshareOffer) {
        throw new Error('Cant find codeshare offer, flightKey:' + codeshareFlight.FlightKey);
    }
    console.log('codeshare offer:', codeshareOffer.OfferID);
    return codeshareOffer;
};

const findCheapestOffer = (response: NDCAirShoppingRS) => {
    let lowestOffer: NDCOffer = undefined;
    // @ts-ignore
    for (const offer of response.AirlineOffers) {
        // console.log('Check price:', offer.TotalPrice)
        if (lowestOffer === undefined   || Number(offer.TotalPrice) < Number(lowestOffer.TotalPrice)) {
            lowestOffer = offer;
        }
    }
    console.log('Cheapest offer:', lowestOffer ? lowestOffer.TotalPrice : 'undefined');
    return lowestOffer;
};

async function dispatch(option: string): Promise<void> {
    switch (option) {
        case 'domesticOW_2ADT_FFRegular_Amex':
            await domesticOW_2ADT_FFRegular_Amex();
            break;
        case 'domesticRT_2ADT_FFExecutive_Mastercard':
            await domesticRT_2ADT_FFExecutive_Mastercard();
            break;
        case 'domesticRT_1ADT_FFGold_Visa':
            await domesticRT_1ADT_FFGold_Visa();
            break;
        case 'internationalRT_2ADT_FFPlatinum_Mastercard':
            await internationalRT_2ADT_FFPlatinum_Mastercard();
            break;
            case 'domesticCodeShareOW_1ADT_FFRegular_Amex':
            await domesticCodeShareOW_1ADT_FFRegular_Amex();
            break;
        default:
            console.log('No option specified');
    }
}

(async function exec(): Promise<void> {
    const option = process.argv[2];
    try {
        await dispatch(option);
    } catch (err: any) {
        console.error(err);
        await debugError(err);
    }
})();

function displayChargeableSeats(seatResponse: NDCSeatAvailabilityResponse): void {
    const serviceNames = new Map < string, string >();
    // map serviceID to seat type
    seatResponse.SeatAvailabilityRS.ServiceDefinitions.forEach(value => {
        serviceNames.set(value.ServiceDefinitionID, value.Name);
    });
    seatResponse.SeatAvailabilityRS.ALaCarteOffer.ALaCarteOfferItems.forEach(value => {
        if (value.UnitPriceDetail.TotalAmount.Total > 0) {
            const seatType = serviceNames.get(value.Service.ServiceDefinitionRef);
            console.log(`Seat type:${seatType}, price: ${value.UnitPriceDetail.TotalAmount.Total}`);
        }
    });
}
