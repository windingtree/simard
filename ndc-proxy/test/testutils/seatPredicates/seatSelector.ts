import {Seat, SeatMap} from '../../../src/interfaces/glider/seatmap';
import {getMapValue} from '../validators';
import {SeatDetails} from './SeatDetails';
import {SeatPredicate} from './seatPredicates';

export function seatSelector(seatMap: SeatMap, predicates: SeatPredicate[]): Seat[] {
    const seats: SeatDetails[] = [];
    seatMap.cabins.forEach(cabin => {
        cabin.seats.forEach(seat => {
            const seatDetails: SeatDetails = {
                seat,
                price: getMapValue(seatMap.prices, seat.optionCode),
            };
            seats.push(seatDetails);
        });
    });
    const filteredSeats: SeatDetails[] = seats.filter(seat => {
        let filterResult = true;
        // console.log(`Check seat:${logSeat(seat)}`);
        predicates.forEach(predicate => {
            if (!predicate.predicate(seat)) {
                filterResult = false;
            }
        });
        return filterResult;
    });
    return filteredSeats.map(value => value.seat);
}
/*

function logSeat(seat: SeatDetails): string {
    return `seat: ${seat.seat.number}, price:${seat.price.public}, char:${seat.seat.characteristics}, available:${seat.seat.available}`;
}
*/
