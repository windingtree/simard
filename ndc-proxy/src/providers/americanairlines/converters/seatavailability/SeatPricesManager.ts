import {ExtendedPriceDetails} from '../../../../interfaces/glider';
import {generateShortUUID} from '../../../../lib/uuid';

interface SeatPriceRecord {
    price: ExtendedPriceDetails;
    optionCode: string;
}

export class SeatPricesManager {
    private pricesMap: Map<string, SeatPriceRecord[]> = new Map<string, SeatPriceRecord[]>();
    public addPrice(seatType: string, seatPrice: ExtendedPriceDetails): string {

        // if there is no entry yet for a provided seatType - initialize it with empty array
        if (!this.pricesMap.has(seatType)) {
            this.pricesMap.set(seatType, []);
        }
        const seatTypePrices: SeatPriceRecord[] = this.pricesMap.get(seatType);
        // check if we already have such price (public amount) for this seat type
        let seatPriceRecord: SeatPriceRecord = seatTypePrices.find(record => record.price.public === seatPrice.public);
        if (!seatPriceRecord) {
            // there was no such price (amount) yet for a given seat type - create new add add to the list
            seatPriceRecord = {
                price: seatPrice,
                optionCode: `${generateShortUUID()}.${seatType.replace(' ', '')}`,
            };
            seatTypePrices.push(seatPriceRecord);
        }
        return seatPriceRecord.optionCode;
    }

    public getPrices(): Map<string, ExtendedPriceDetails> {
        const result = new Map<string, ExtendedPriceDetails>();
        [...this.pricesMap.values()].forEach(seatTypePrices => {
            seatTypePrices.forEach(seatTypePrice => {
                result.set(seatTypePrice.optionCode, seatTypePrice.price);
            });
        });
        return result;
    }
}
