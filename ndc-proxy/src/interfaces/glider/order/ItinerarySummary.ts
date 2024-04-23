import { ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {Segment} from '../air';

export class ItinerarySummary {
    @ValidateNested({each: true})
    @Type(() => Segment)
    public segments: Segment[];

    constructor(segments?: Segment[]) {
        this.segments = segments;
    }
}
