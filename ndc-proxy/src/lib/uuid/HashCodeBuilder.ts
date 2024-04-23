import HashCode from 'ts-hashcode';

/**
 * Class which generates hash code based on provided values.
 * It's fast implementation based on hashCode implementations in Jave.
 * Collisions are possible but very seldom.
 */
export class HashCodeBuilder {
    private values: any[] = [];
    public add(input: any): HashCodeBuilder {
        this.values.push(input);
        return this;
    }

    public hashCode(): number {
        let result = 0;
        this.values.forEach(value => {
            // tslint:disable-next-line:no-bitwise
            result = (((result << 5) - result) + HashCode(value)) & 0xFFFFFFFF;
        });
        return result;
    }
}
