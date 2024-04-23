import {SeatDetails} from './SeatDetails';

export abstract class SeatPredicate {
    public abstract predicate(seatDetails: SeatDetails): boolean;
}

export class SeatCharacteristicPredicate extends SeatPredicate {
    constructor(private characteristic: string) {
        super();
    }
    public predicate(seatDetails: SeatDetails): boolean {
        const result =  seatDetails.seat.characteristics.includes(this.characteristic);
        // console.log(`SeatCharacteristicPredicate ==> ${result}`);
        return result;
    }
}

export class SeatRowRangePredicate extends SeatPredicate {
    constructor(private minOrEqual: number, private maxOrEqual: number) {
        super();
    }
    public predicate(seatDetails: SeatDetails): boolean {
        return this.minOrEqual <= seatDetails.seat.row && seatDetails.seat.row <= this.maxOrEqual;
    }
}

export class SeatColPredicate extends SeatPredicate {
    constructor(private col: string) {
        super();
    }
    public predicate(seatDetails: SeatDetails): boolean {
        return seatDetails.seat.column === this.col;
    }
}

export class SeatAvailabilityPredicate extends SeatPredicate {
    constructor(private available: boolean) {
        super();
    }
    public predicate(seatDetails: SeatDetails): boolean {
        const result = seatDetails.seat.available === this.available;
        // console.log(`SeatAvailabilityPredicate ==> ${result}`);
        return result;
    }
}

export class SeatPriceRangePredicate extends SeatPredicate {
    constructor(private minOrEqual: number, private maxOrEqual: number) {
        super();
    }
    public predicate(seatDetails: SeatDetails): boolean {
        const result = this.minOrEqual <= seatDetails.price.public && seatDetails.price.public <= this.maxOrEqual;
        // console.log(`SeatPriceRangePredicate, check ${this.minOrEqual} < ${seatDetails.price.public} <= ${this.maxOrEqual} ==> ${result}`);
        return result;
    }
}
