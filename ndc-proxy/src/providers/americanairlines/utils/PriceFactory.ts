import {NDCCurrencyMetadata} from '../../../interfaces/ndc';
import {Price} from '../../../interfaces/glider';

const ZERO_AMOUNT_PRICE = new Price(0, 'USD');

/**
 * American Airlines (probably others too) return fare amounts as integers and provide metadata for a given currency.
 * Example:
 * - returned price from AA: 12345 USD
 * - Metadata for USD: 2 decimals
 * In this case, 12345 should be converted to 123.45 USD
 *
 * This class is a helper to convert monetary units to a final amount based on currencies metadata (retrieved from NDC endpoint)
 */
export class PriceFactory {

    public static convertAmount(rawAmount: number, decimals: number): number {
        const divider = Math.pow(10, decimals);
        return rawAmount / divider;
    }
    private currencyMetadata: Map<string, NDCCurrencyMetadata> = new Map<string, NDCCurrencyMetadata>();

    /**
     * Initialize factory.
     * @param currencies Optional parameter with array of NDCCurrencyMetadata.
     */
    constructor(currencies?: NDCCurrencyMetadata[] ) {
        if (Array.isArray(currencies)) {
            this.addCurrencyMetadatas(currencies);
        }
    }

    /**
     * Load array of currency metadata (same as constructor)
     * @param currencies
     */
    public addCurrencyMetadatas(currencies: NDCCurrencyMetadata[]): void {
        currencies.forEach(currencyMetadata => {
            this.addCurrencyMetadata(currencyMetadata);
        });
    }

    /**
     * Load single currency metadata
     * @param currency
     */
    public addCurrencyMetadata(currency: NDCCurrencyMetadata): void {
        const {MetadataKey: currencyCode} = currency;
        this.currencyMetadata.set(currencyCode.toUpperCase(), currency);
    }

    public createPrice(currencyCode: string, rawAmount: number): Price {
        // if it's zero amount - we normally don't have to convert
        // moreover, AA returns sometimes zero amount price WITHOUT CURRENCY CODE(!)
        // so we need to handle it here - if price is 0 and there is no currency code, by default return 0USD
        if (rawAmount === 0) {
            if (currencyCode) {
                return new Price(0, currencyCode);
            } else {
                return ZERO_AMOUNT_PRICE;
            }
        }

        const decimals = this.getCurrencyDecimals(currencyCode);
        const priceAmount = PriceFactory.convertAmount(rawAmount, decimals);
        return new Price(priceAmount, currencyCode);
    }

    public convertPrice(rawAmount: number, currencyCode: string): number {
        if (rawAmount === 0) {
            return 0;
        }
        const decimals = this.getCurrencyDecimals(currencyCode);
        return PriceFactory.convertAmount(rawAmount, decimals);
    }
    private getCurrencyDecimals(currencyCode: string): number {
        const currencyCodeUpper = currencyCode.toUpperCase();
        if (!this.currencyMetadata.has(currencyCodeUpper)) {
            throw new Error(`Missing currency metadata for currency code:${currencyCodeUpper}`);
        }
        return this.currencyMetadata.get(currencyCodeUpper).Decimals;
    }
}
