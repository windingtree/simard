import {Type} from 'class-transformer';

export class NDCCurrencyMetadata {
    public MetadataKey: string;     // currency code
    public Application: string;

    @Type(() => Number)
    public Decimals: number;        // number of decimals

    constructor(MetadataKey?: string, Decimals?: number) {
        this.MetadataKey = MetadataKey;
        this.Decimals = Decimals;
    }
}
