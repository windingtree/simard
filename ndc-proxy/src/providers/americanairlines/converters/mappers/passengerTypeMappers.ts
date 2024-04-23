import {PassengerType} from '../../../../interfaces/glider';
import {NDCPassengerType} from '../../../../interfaces/ndc';

export function convertFromGliderPassengerType(type: PassengerType): NDCPassengerType {
    switch (type) {
        case PassengerType.ADT:
            return NDCPassengerType.ADT;
        case PassengerType.CHD:
            return NDCPassengerType.CNN;
        case PassengerType.INF:
            return NDCPassengerType.INF;
        default:
            throw new Error(`Unsupported passenger type:${type}`);
    }
}

export function convertToGliderPassengerType(type: NDCPassengerType): PassengerType {
    switch (type) {
        case NDCPassengerType.ADT:
            return PassengerType.ADT;
        case NDCPassengerType.CNN:
            return PassengerType.CHD;
        case NDCPassengerType.INF:
            return PassengerType.INF;
        default:
            throw new Error(`Unsupported passenger type:${type}`);
    }
}

/*

export function convertFromGliderPassengers(passengers: PassengerSearchCriteria[]): NDCPassenger[] {
    let paxId = 1;
    const ndcPassengers: NDCPassenger[] = [];
    for (const passenger of passengers) {
        const ndcPassenger: NDCPassenger = {
            type: convertFromGliderPassengerType(passenger.type),
            PassengerID: `T${paxId++}`,
        };
        ndcPassengers.push(ndcPassenger);
    }
    return ndcPassengers;
}
*/
