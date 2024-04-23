import {
    Civility,
    FlightSearchCriteria,
    Gender,
    LocationIATA,
    LocationType,
    Passenger,
    PassengerSearchCriteria,
    PassengerType,
    Price,
    SearchCriteria,
    SegmentCriteria
} from '../../../src/interfaces/glider';
import * as faker from 'faker';
import moment from 'moment';
import {SimardClient} from '../../../src/lib/simard';
import {Container} from 'typedi';
import {env} from '../../../src/env';
import {FrequentFlyerAccount} from '../../../src/interfaces/glider';
import {
    configureSimardClientToSimulateItIsGliderOTA,
    restoreSimardClientIssuerDetailsToDefaults
} from './simardClientInstrumentation';

export function createSegmentCriteria(orig: string, dest: string, departureDate: Date): SegmentCriteria {
    const segment = new SegmentCriteria();
    segment.origin = new LocationIATA();
    segment.origin.locationType = LocationType.airport;
    segment.origin.iataCode = orig;

    segment.destination = new LocationIATA();
    segment.destination.locationType = LocationType.airport;
    segment.destination.iataCode = dest;

    segment.departureTime = departureDate;

    return segment;
}
export function createSearchCriteria(segments: SegmentCriteria[], passengers: PassengerSearchCriteria[]): SearchCriteria {
    const searchCriteria: SearchCriteria = new SearchCriteria();
    searchCriteria.passengers = passengers;
    searchCriteria.itinerary = new FlightSearchCriteria();
    searchCriteria.itinerary.segments = segments;
    return searchCriteria;
}

export function createPassengerCriteria(type: PassengerType, count: number = 1): PassengerSearchCriteria {
    return new PassengerSearchCriteria(count, type);
}

export function addPassengerFrequentFlyerProgram(criteria: PassengerSearchCriteria, airlineCode: string, accountNumber: string, programName: string): void {
    if (!Array.isArray(criteria.loyaltyPrograms)) {
        criteria.loyaltyPrograms = [];
    }
    const fqtv = new FrequentFlyerAccount();
    fqtv.accountNumber = accountNumber;
    fqtv.airlineCode = airlineCode;
    fqtv.programName = programName;
    criteria.loyaltyPrograms.push(fqtv);
}

export function prepareFakePassengerDetails(type: PassengerType): Passenger {
    const pax = new Passenger();
    pax.type = type;
    pax.civility = faker.random.arrayElement([Civility.MR, Civility.MRS]);
    pax.firstnames = [faker.name.firstName()];
    pax.lastnames = [faker.name.lastName()];
    pax.middlenames = [faker.name.firstName()];
    if (type === PassengerType.ADT) {
        pax.birthdate = moment().subtract(20, 'years').toDate();
    }
    if (type === PassengerType.CHD) {
        pax.birthdate = moment().subtract(10, 'years').toDate();
    }
    if (type === PassengerType.INF) {
        pax.birthdate = moment().subtract(1, 'years').toDate();
    }
    pax.gender = faker.random.arrayElement([Gender.Male, Gender.Female]);
    pax.contactInformation = [
        '00123123123123',
        'tomasz@windingtree.com',
    ];

    return pax;
}

export function preparePassengerDetailsForSeatmapRequest(passengersFromSearchResponse: Map<string, Passenger>): Map<string, Passenger> {
    const passengersMap = new Map<string, Passenger>();
    Object.keys(passengersFromSearchResponse).map(paxId => {
        const pax = new Passenger();
        pax.type = passengersFromSearchResponse[paxId].type;
        pax.civility = faker.random.arrayElement([Civility.MR, Civility.MRS]);
        pax.firstnames = [faker.name.firstName()];
        pax.lastnames = [faker.name.lastName()];
        pax.middlenames = [faker.name.firstName()];
        passengersMap.set(paxId, pax);
    });
    return passengersMap;
}

export function preparePassengerDetailsForOrderCreate(passengersFromSearchResponse: Map<string, Passenger>): Map<string, Passenger> {
    const passengersWithContactDetails = new Map<string, Passenger>();
    Object.keys(passengersFromSearchResponse).map(paxId => {
        const paxType = passengersFromSearchResponse[paxId].type;
        const passenger = prepareFakePassengerDetails(paxType);
        passengersWithContactDetails.set(paxId, passenger);
    });
    return passengersWithContactDetails;
}

export async function createGuaranteeForGliderConnectStaging(price: Price): Promise<string> {
    const simardClient: SimardClient = Container.get<SimardClient>(SimardClient);
    try {
        // fake it's an OTA making a call to Simard(to create a guarantee on it's behalf, guarantee is for Glider Aggregator)
        configureSimardClientToSimulateItIsGliderOTA(simardClient);
        const guarantee = await simardClient.createGuarantee(price.public, price.currency, env.app.aggregatorOrgId);
        return guarantee.guaranteeId;
    } finally {
        // restore default SimardClient configuration to avoid side effects
        restoreSimardClientIssuerDetailsToDefaults(simardClient);
    }
}

export async function simulateDepositInSimardStaging(price: Price): Promise<string> {
    const simardClient: SimardClient = Container.get<SimardClient>(SimardClient);
    try {
        // fake it's an OTA making a call to Simard(to simulate deposit on it's behalf)
        configureSimardClientToSimulateItIsGliderOTA(simardClient);
        const settlement = await simardClient.simulateDeposit(price.public, price.currency);
    return settlement.settlementId;
    } finally {
        // restore default SimardClient configuration to avoid side effects
        restoreSimardClientIssuerDetailsToDefaults(simardClient);
    }
}
