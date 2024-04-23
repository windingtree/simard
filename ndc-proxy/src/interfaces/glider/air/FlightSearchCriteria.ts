import {SegmentCriteria} from './SegmentCriteria';
import {ArrayMinSize, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';

export class FlightSearchCriteria  {
    @ValidateNested({ each: true })
    @Type(() => SegmentCriteria)
    @ArrayMinSize(1)
    public segments: SegmentCriteria[];

    constructor(segments?: SegmentCriteria[]) {
        this.segments = segments;
    }
}
