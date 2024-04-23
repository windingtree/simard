import {IsNotEmpty, IsString, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {Passenger} from '../common';

export class CreateOrderRequest  {
    @IsNotEmpty()
    @IsString()
    public offerId: string;

    @IsNotEmpty()
    @IsString()
    public guaranteeId: string;

    @ValidateNested({ each: true })
    @Type(() => Passenger)
    public passengers: Map<string, Passenger>;

}

export function objToJSon(obj: any): any {
    console.log('objToJSon() invoked');
    const object = { };
    const props = Object.getOwnPropertyNames(obj);
    for (const key of props) {
        const val = obj[key];
        if (val instanceof Map ) {
            object[key] = mapToJson(val);
        } else {
            object[key] = val;
        }

    }
    return object;
}

export function mapToJson(map: Map<any, any>): any {
    console.log('mapToJSon() invoked');
    const object = { };
    for (const key of map.keys()) {
        const val = map.get(key);
        if (val instanceof Map ) {
            object[key] = mapToJson(val);
        } else if (val instanceof Date) {
            object[key] = 'date';
        } else {
            object[key] = val;
        }

    }
    return object;
}
