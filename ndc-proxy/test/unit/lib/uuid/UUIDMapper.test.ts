import {UUIDMapper} from '../../../../src/lib/uuid';

describe('UUIDMapper', () => {
    it('should generate new UUID keys for "original" keys', () => {
        const mapper = new UUIDMapper();
        const value1 = mapper.map('key1');
        const value2 = mapper.map('key2');

        expect(value1).toHaveLength(36);
        expect(value2).toHaveLength(36);
        expect(value1).not.toEqual(value2);
    });

    it('should reverse map(return "original" key for same "mapped" key (UUID)', () => {
        const mapper = new UUIDMapper();
        const value1 = mapper.map('key1');
        const value2 = mapper.map('key2');

        expect(value1).not.toEqual(value2);

        const key1_reversed = mapper.reverse(value1);
        const key2_reversed = mapper.reverse(value2);

        expect(key1_reversed).toEqual('key1');
        expect(key2_reversed).toEqual('key2');

    });

    it('should return same "mapped" key(UUID) for same "original" key', () => {
        const mapper = new UUIDMapper();
        const value1 = mapper.map('key1');
        const value2 = mapper.map('key1');

        expect(value1).toEqual(value2);
    });

    it('should correctly serialize to a hashmap ("original" key => "mapped" key)', () => {
        const mapper = new UUIDMapper();
        const value1 = mapper.map('key1');
        const value2 = mapper.map('key2');

        const serializedMap = mapper.serialize();
        const expectedMap = {
            key1: value1,
            key2: value2,
        };

        expect(serializedMap).toStrictEqual(expectedMap);
    });
    it('should correctly deserialize from a hashmap ("original" key => "mapped" key)', () => {
        const value1 = '89dc7371-d224-4fae-89ca-7ff435ed7b73';
        const value2 = '11dc7371-d224-4fae-89ca-7ff435ed7b22';
        const serializedMap = {
            key1: value1,
            key2: value2,
        };
        const mapper = new UUIDMapper(serializedMap);
        const value1_mapped = mapper.map('key1');
        const value2_mapped = mapper.map('key2');

        expect(value1_mapped).toEqual(value1);
        expect(value2_mapped).toEqual(value2);
    });
});
