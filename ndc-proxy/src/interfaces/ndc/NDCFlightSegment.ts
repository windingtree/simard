import {Type} from 'class-transformer';
import {NDCStationLocation} from './NDCStationLocation';
import {NDCFlightInfo} from './NDCFlightInfo';
import { NDCFlightSegmentEquipment } from './NDCFlightSegmentEquipment';

export class NDCFlightSegment {
    public SegmentKey: string;
    public ConnectInd: string;
    public ElectronicTicketInd: string;
    public SecureFlight: string;

    @Type(() => NDCStationLocation)
    public Departure: NDCStationLocation;

    @Type(() => NDCStationLocation)
    public Arrival: NDCStationLocation;

    @Type(() => NDCFlightInfo)
    public MarketingCarrier?: NDCFlightInfo;

    @Type(() => NDCFlightInfo)
    public OperatingCarrier?: NDCFlightInfo;
    public ClassOfService: string;

    @Type(() => NDCFlightSegmentEquipment)
    public Equipment: NDCFlightSegmentEquipment;
}
