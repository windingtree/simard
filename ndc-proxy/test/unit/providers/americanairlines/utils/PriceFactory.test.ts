import {NDCCurrencyMetadata} from '../../../../../src/interfaces/ndc';
import {PriceFactory} from '../../../../../src/providers/americanairlines/utils/PriceFactory';

const ABC: NDCCurrencyMetadata = new NDCCurrencyMetadata('ABC', 0);   // 0 decimals
const DEF: NDCCurrencyMetadata = new NDCCurrencyMetadata('DEF', 1);   // 1
const USD: NDCCurrencyMetadata = new NDCCurrencyMetadata('USD', 2);   // currency code with capitals
const usd: NDCCurrencyMetadata = new NDCCurrencyMetadata('usd', 2);   // currency code with lowercase

describe('PriceFactory', () => {
    describe('#constructor', () => {
        it('should correctly initialize with currencies metadata provided as constructor parameter',  () => {
            const priceFactory: PriceFactory = new PriceFactory([ABC, DEF]);
            const abc_converted = priceFactory.createPrice('ABC', 12345);
            expect(abc_converted.public).toEqual(12345);
            expect(abc_converted.currency).toEqual('ABC');

            const def_converted = priceFactory.createPrice('ABC', 12345);
            expect(def_converted.public).toEqual(12345);
            expect(def_converted.currency).toEqual('ABC');
        });
    });
    describe('#addCurrencyMetadatas', () => {
        it('should correctly initialize with currencies metadata loaded with addCurrencyMetadatas',  () => {
            const priceFactory: PriceFactory = new PriceFactory();
            priceFactory.addCurrencyMetadatas([ABC, DEF]);
            const abc_converted = priceFactory.createPrice('ABC', 12345);
            expect(abc_converted.public).toEqual(12345);
            expect(abc_converted.currency).toEqual('ABC');

            const def_converted = priceFactory.createPrice('DEF', 12345);
            expect(def_converted.public).toEqual(1234.5);
            expect(def_converted.currency).toEqual('DEF');
        });
        it('should correctly convert currency even if in metadata currency code is lowercase ',  () => {
            const priceFactory: PriceFactory = new PriceFactory([usd]);
            const result = priceFactory.createPrice('USD', 12345);
            expect(result.public).toEqual(123.45);
            expect(result.currency).toEqual('USD');
        });
    });
    describe('#createPrice', () => {
        it('should correctly convert price for different values of "decimal" parameter',  () => {
            const priceFactory: PriceFactory = new PriceFactory();
            priceFactory.addCurrencyMetadata(ABC);      // 0 decimals
            let priceABC = priceFactory.createPrice('ABC', 12345);    // request price using capital letters
            expect(priceABC.public).toEqual(12345);
            expect(priceABC.currency).toEqual('ABC');

            priceABC = priceFactory.createPrice('ABC', 0);    // request price using capital letters
            expect(priceABC.public).toEqual(0);
            expect(priceABC.currency).toEqual('ABC');

            priceFactory.addCurrencyMetadata(DEF);      // 1 decimals
            const priceDEF = priceFactory.createPrice('DEF', 12345);    // request price using capital letters
            expect(priceDEF.public).toEqual(1234.5);
            expect(priceDEF.currency).toEqual('DEF');

        });

        it('should correctly convert price even if requested currency code is lowercase',  () => {
            const priceFactory: PriceFactory = new PriceFactory([USD]);

            let result = priceFactory.createPrice('USD', 12345);    // request price using capital letters
            expect(result.public).toEqual(123.45);
            expect(result.currency).toEqual('USD');

            result = priceFactory.createPrice('usd', 12345);    // request price using lowercase
            expect(result.public).toEqual(123.45);
            expect(result.currency).toEqual('usd');
        });
        it('should fail if there is no currency definition',  () => {
            const priceFactory: PriceFactory = new PriceFactory([USD]);

            let result = priceFactory.createPrice('USD', 12345);
            expect(result).not.toBeUndefined();

            expect(() => {result = priceFactory.createPrice('DUMMY', 12345); }).toThrowError();    // request currency which was not defined
        });
    });
});
