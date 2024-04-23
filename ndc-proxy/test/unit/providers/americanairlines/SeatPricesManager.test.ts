import {SeatPricesManager} from '../../../../src/providers/americanairlines/SeatPricesManager';
import {ExtendedPriceDetails} from '../../../../src/interfaces/glider';

const price100USD = new ExtendedPriceDetails(100, 'USD');
const price200USD = new ExtendedPriceDetails(200, 'USD');

const seatStandard = 'Standard seat';
const seatExtraLeg = 'Extra legroom seat';

describe('SeatPricesManager', () => {
    describe('#addPrice', () => {
        it('should generate same option codes for same price amount AND same seat type', () => {
            const sm = new SeatPricesManager();
            const optionCode100USD = sm.addPrice(seatStandard, price100USD);
            expect(optionCode100USD).not.toBeUndefined();
            expect(optionCode100USD.length).toBeGreaterThan(0);

            const optionCode200USD = sm.addPrice(seatStandard, price200USD);
            expect(optionCode200USD).not.toBeUndefined();
            expect(optionCode200USD.length).toBeGreaterThan(0);

            expect(optionCode100USD).not.toEqual(optionCode200USD);

            const optionCode100USDDuped = sm.addPrice(seatStandard, price100USD);
            expect(optionCode100USDDuped).toEqual(optionCode100USD);
        });

        it('should generate different option codes for same price amount but different seat type', () => {
            const sm = new SeatPricesManager();
            const optionCode100USD_standardSeat = sm.addPrice(seatStandard, price100USD);
            const optionCode100USD_extraLegSeat = sm.addPrice(seatExtraLeg, price100USD);
            expect(optionCode100USD_standardSeat).not.toEqual(optionCode100USD_extraLegSeat);
        });

    });
    describe('#getPrices', () => {
        it('should return map of option codes with its associated prices', () => {
            const sm = new SeatPricesManager();
            const optionCode100USD_standard = sm.addPrice(seatStandard, price100USD);
            const optionCode100USD_extraleg = sm.addPrice(seatExtraLeg, price100USD);
            const optionCode200USD_standard = sm.addPrice(seatStandard, price200USD);
            const optionCode200USD_extraleg = sm.addPrice(seatExtraLeg, price200USD);
            const pricesMap: Map<string, ExtendedPriceDetails> = sm.getPrices();
            expect(pricesMap.has(optionCode100USD_standard));
            expect(pricesMap.has(optionCode100USD_extraleg));
            expect(pricesMap.has(optionCode200USD_standard));
            expect(pricesMap.has(optionCode200USD_extraleg));

            expect(pricesMap.get(optionCode100USD_standard)).toEqual(price100USD);
            expect(pricesMap.get(optionCode100USD_extraleg)).toEqual(price100USD);
            expect(pricesMap.get(optionCode200USD_standard)).toEqual(price200USD);
            expect(pricesMap.get(optionCode200USD_extraleg)).toEqual(price200USD);
        });
    });
});
