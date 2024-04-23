// import {generateUUID} from './generateUUID';

import {generateUUID} from './generateUUID';

export interface Mapping {
    [id: string]: string;
}

/**
 * Class which allows mapping of string keys to another keys.
 * E.g. key 'key123' can be mapped into '123e4567-e89b-12d3-a456-426614174000'.
 * Later on, key 'key123' can be retrieved using '123e4567-e89b-12d3-a456-426614174000' (reverse mapping)
 */
export class UUIDMapper {
    private mapping: Map<string, string> = new Map<string, string>();
    private reverseMapping: Map<string, string> = new Map<string, string>();

    constructor(existingMapping: Mapping|undefined = undefined) {
        if (existingMapping !== undefined) {
            this.initializeUsingHashMap(existingMapping);
        }
    }

    public map(id: string): string {
        if (this.mapping.has(id)) {
            return this.mapping.get(id);
        }
        const newKey = generateUUID();
        this.mapping.set(id, newKey);
        this.reverseMapping.set(newKey, id);
        return newKey;
    }

    public reverse(id: string): string {
        if (!this.reverseMapping.has(id)) {
            throw new Error(`UUIDMapper cannot reverse mapping for key:${id}, original key does not exist`);
        }
        return this.reverseMapping.get(id);
    }

    public serialize(): Mapping {
        const result: any = {};
        this.mapping.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    private initializeUsingHashMap(map: Mapping): void {
        this.mapping.clear();
        this.reverseMapping.clear();
        Object.keys(map).forEach(key => {
            const value = map[key];
            this.mapping.set(key, value);
            this.reverseMapping.set(value, key);
        });
    }
}
