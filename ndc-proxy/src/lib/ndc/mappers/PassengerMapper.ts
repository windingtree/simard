/*
import {INDCTypeMapper} from './INDCTypeMapper';
import {NDCPassenger, NDCPassengerType} from '../../../interfaces/ndc';
import {IPassengerSearchCriteria, Passenger, PassengerType} from '../../../interfaces/glider';

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

export function convertFromGliderPassengers(passengers: IPassengerSearchCriteria[]): NDCPassenger[] {
    let paxId = 0;
    const ndcPassengers: NDCPassenger[] = [];
    for (const passenger of passengers) {
        const ndcPassenger: NDCPassenger = {
            type: convertFromGliderPassengerType(passenger.type),
            PassengerID: `pax${paxId++}`,
        };
        ndcPassengers.push(ndcPassenger);
    }
    return ndcPassengers;
}

export class PassengerMapper implements INDCTypeMapper<NDCPassenger, Passenger> {
    public convertFromGlider(gliderObj: Passenger): NDCPassenger {
        return undefined;
    }

}
*/
