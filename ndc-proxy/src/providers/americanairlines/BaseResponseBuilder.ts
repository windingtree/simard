import {Mapping, UUIDMapper} from '../../lib/uuid';
import {PriceFactory} from './utils/PriceFactory';
import {NDCCurrencyMetadata} from '../../interfaces/ndc';
import {ExtendedSessionContext} from '../../services/ExtendedSessionContext';

export abstract class BaseResponseBuilder<GliderResponseType> {
    private readonly mapper: UUIDMapper;
    private priceFactory: PriceFactory;

    protected constructor(existingMapping: Mapping|undefined = undefined) {
        this.mapper = new UUIDMapper(existingMapping);
    }
    public abstract build(sessionContext: ExtendedSessionContext): GliderResponseType;
    public getMapper(): UUIDMapper {
        return this.mapper;
    }

    /**
     * Convert price returned by NDC (without decimals) to a price with decimals.
     * Number of decimal points for a given currency is taken from NDCCurrencyMetadata returned by NDC
     * @param rawAmount amount returned by NDC (without decimal points)
     * @param currencyCode currency code
     * @protected
     */
    public convertPrice(rawAmount: number, currencyCode: string): number {
        return this.priceFactory.convertPrice(rawAmount, currencyCode);
    }

    /**
     * Initialize currency metadata.
     * NDC returns prices without decimal point (e.g. 12345USD in NDC is 123.45USD that NDC Proxy should return)
     * Responses from NDC contain currency metadata which tells how many decimal points given currency has
     * @param ndcCurrencyMetadata
     * @protected
     */
    protected initializePriceConverter(ndcCurrencyMetadata: NDCCurrencyMetadata[]): void {
        this.priceFactory = new PriceFactory(ndcCurrencyMetadata);
    }

    protected map(id: string): string {
        return this.mapper.map(id);
    }

    protected reverse(id: string): string {
        return this.mapper.reverse(id);
    }
}
