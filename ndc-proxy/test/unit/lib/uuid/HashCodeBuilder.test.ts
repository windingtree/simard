import {HashCodeBuilder} from '../../../../src/lib/uuid';

describe('HashCodeBuilder.test', () => {

    it(`should return 0 for null values`, () => {
        // tslint:disable-next-line:no-null-keyword
        expect(generateHash(null)).toEqual(0);
    });

    it(`should return 0 for function values`, () => {
        expect(generateHash((() => {}))).toEqual(0);
    });

    it(`should return 0 for undefined values`, () => {
        expect(generateHash(undefined)).toEqual(0);
    });

    it(`should handle string values`, () => {
        const input = 'abc';
        expect(generateHash(input)).toEqual(generateHash(input));
    });

    it(`should handle array values`, () => {
        const input = ['foo', 'bar'];
        expect(generateHash(input)).toEqual(generateHash(input));
    });

    it(`should handle boolean values`, () => {
        expect(generateHash(true)).toEqual(68280758);
        expect(generateHash(false)).toEqual(161908043);
    });

    it(`should handle empty object values`, () => {
        let input = {};
        expect(generateHash(input)).toEqual(generateHash(input));
        input = undefined;
        expect(generateHash(input)).toEqual(generateHash(input));
        // tslint:disable-next-line:no-null-keyword
        input = null;
        expect(generateHash(input)).toEqual(generateHash(input));
        input = [];
        expect(generateHash(input)).toEqual(generateHash(input));
    });

    it(`should handle object values`, () => {
        expect(generateHash({
            foo: 'bar',
        })).toEqual(-1271284534);

        const input = {foo: 'foo'};
        expect(generateHash(input)).toEqual(generateHash(input));
    });

    it(`should handle object with inherited properties`, () => {
        class ParentObject {
            public bar: string;
            constructor(bar: string) {
                this.bar = bar;
            }
        }
        class ChildObject extends ParentObject {
            public foo: string;
            constructor(foo: string, bar: string) {
                super(bar);
                this.foo = 'bar';
            }
        }

        const fooBar = new ChildObject('foo', 'bar');
        expect(generateHash(fooBar)).toEqual(1046333794);

        expect(generateHash(fooBar)).toEqual(generateHash(fooBar));

        const fooXXX = new ChildObject('foo', 'xxx');
        expect(generateHash(fooXXX)).toEqual(generateHash(fooXXX));

        expect(generateHash(fooBar)).not.toEqual(generateHash(fooXXX));
    });

    it(`should handle deep object values`, () => {
        expect(generateHash({
            foo: {
                bar: {
                    hello: 'world',
                },
            },
        })).toEqual(-1783273289);
    });

    it(`should handle Date values`, () => {
        let date = new Date('July 20, 69 00:20:18 GMT+00:00');
        expect(generateHash(date)).toEqual(1901718799);

        date = new Date('July 20, 69 00:20:18 GMT+00:00');
        expect(generateHash(date)).toEqual(generateHash(date));

        const date2 = new Date('July 21, 69 00:20:18 GMT+00:00');
        expect(generateHash(date)).not.toEqual(generateHash(date2));
    });

    it(`should handle hash correctly for multiple fields`, () => {
        const hash1 = new HashCodeBuilder().add('foo').add('bar').hashCode();
        const hash2 = new HashCodeBuilder().add('foo').add('bar').hashCode();
        expect(hash1).toEqual(hash2);

        const hash3 = new HashCodeBuilder().add('foo').add('XXX').hashCode();
        expect(hash1).not.toEqual(hash3);
        expect(hash1).not.toEqual(hash3);
    });

    it(`should return 0 if no fields were added`, () => {
        expect(new HashCodeBuilder().hashCode()).toEqual(0);
    });
});

const generateHash = (input: any): number => {
    const hashCodeBuilder = new HashCodeBuilder();
    return hashCodeBuilder.add(input).hashCode();
};
