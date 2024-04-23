import {
    getCardCode,
    cardCodesOTA,
    cardCodesIATA,
} from './cardUtils';

describe('cardUtils', () => {
    describe('#getCardCode', () => {
        const cardsSet = [
            {
                type: 'ota',
                source: cardCodesOTA,
            },
            {
                type: 'iata',
                source: cardCodesIATA,
            },
        ];

        it('should to throw if wrong card has been provided', async () => {
            cardsSet.forEach(({type}) => {
              expect(() => getCardCode({brand: undefined}, type)).toThrow();
              expect(() => getCardCode({brand: 'UNKNOWN_CARD'}, type)).toThrowError();
              expect(() => getCardCode({brand: []}, type)).toThrowError();
              expect(() => getCardCode({brand: {}}, type)).toThrowError();
            });
        });

        it('should to throw if wrong type has been provided', async () => {
            cardsSet.forEach(({source}) => {
                Object.keys(source).forEach(c => {
                  expect(() => getCardCode({brand: c}, undefined)).toThrowError('Missing Card Code type');
                  expect(() => getCardCode({brand: c}, 'UNKNOWN_TYPE')).toThrowError('Missing Card Code type');
                });
            });
        });

        it('should return card codes by type', async () => {
            cardsSet.forEach(({type, source}) => {
                Object.keys(source).forEach(c => {
                    const result = getCardCode({brand: c}, type);
                    expect(result).toBe(source[c]);
                });
            });
        });
    });
});
