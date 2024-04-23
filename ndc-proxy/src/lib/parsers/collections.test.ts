import {
  uniqueObjectsList,
  flatOneDepth,
} from './collections';

describe('collectionutils', () => {
  describe('#uniqueObjectsList', () => {
    const arrayOfObjects = [
      {
        a: 1,
      },
      {
        a: 2,
      },
      {
        c: 1,
      },
      {
        a: 1,
      },
    ];

    it('should to throw if wrong array has been provided', async () => {
      expect(() => uniqueObjectsList(undefined)).toThrowError();
      expect(() => uniqueObjectsList('wrongType')).toThrowError();
      expect(() => uniqueObjectsList({})).toThrowError();
    });

    it('should return unique objects array', async () => {
      const result = uniqueObjectsList(arrayOfObjects);
      const uniquesSet = new Set(result);
      expect(Array.from(uniquesSet)).toEqual(result);
    });
  });

  describe('#flatOneDepth', () => {
    const deepArray = [
      1,
      2,
      [3, 4, 5, [6]],
      [7],
      8,
    ];
    const flatArray = [
      1, 2, 3,
      4, 5, [6],
      7, 8,
    ];

    it('should to throw if wrong array has been provided', async () => {
      expect(() => flatOneDepth(undefined)).toThrowError();
      expect(() => flatOneDepth('wrongType')).toThrowError();
      expect(() => flatOneDepth({})).toThrowError();
    });

    it('should return flat array', async () => {
      const result = flatOneDepth(deepArray);
      expect(result).toBeInstanceOf(Array);
      expect(result).toEqual(flatArray);
    });
  });
});
