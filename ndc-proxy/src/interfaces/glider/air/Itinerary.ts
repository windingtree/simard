import { ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {Segment} from './Segment';

export class Itinerary {
    @ValidateNested({each: true})
    @Type(() => Segment)
    public segments: Map<string, Segment>;

    constructor(segments?: Map<string, Segment>) {
        this.segments = segments;
    }
}
