import {v4} from 'uuid';

export function generateShortUUID(): string {
    return v4().split('-')[0].toUpperCase();
}
