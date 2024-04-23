import {ToStringBuilder} from '../../../../src/lib/utils/ToStringBuilder';

describe('ToStringBuilder.ts', () => {
    test('Should not print stack out in production', () => {
        const toStringBuilder = new ToStringBuilder('SomeClass')
            .addField('stringField', 'value1')
            .addField('numberField', 2)
            .addField('booleanField', true)
            .addField('undefinedField', undefined);
        const actual = toStringBuilder.build();
        expect(actual).toBe('SomeClass, [stringField=value1],[numberField=2],[booleanField=true],[undefinedField=undefined]');
    });

});
