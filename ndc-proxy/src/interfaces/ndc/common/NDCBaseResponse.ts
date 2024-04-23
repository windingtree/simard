import {Type} from 'class-transformer';
import {NDCPassenger} from '../NDCPassenger';
import {NDCBaggageAllowanceListItem} from '../NDCBaggageAllowanceListItem';
import {NDCFareGroup} from '../NDCFareGroup';
import {NDCFlightSegment} from '../NDCFlightSegment';
import {NDCFlight} from '../NDCFlight';
import {NDCPriceClassListItem} from '../NDCPriceListItem';
import {NDCMetadata} from './NDCMetadata';
import {NDCServiceDefinition} from './NDCServiceDefinition';
import {NDCResponseError} from './NDCResponseError';
import {NDCContactInformationProvided} from '../NDCContactInformation';

export class NDCBaseResponse {

    public success?: string;    // if present - operation succeeded

    public Warnings?: string[]; // together with 'success' element may provide additional information about warnings

    @Type(() => NDCResponseError)
    public Errors?: NDCResponseError[];   // if operation failed - will contain list of errors that occurred

    public TransactionIdentifier?: string;  // transaction ID

    // below are 'datalists' (/soapenv:Envelope/soapenv:Body/FlxTransactionResponse/.../DataLists
    @Type(() => NDCPassenger)
    public PassengerList: NDCPassenger[];

    @Type(() => NDCContactInformationProvided)
    public ContactList: NDCContactInformationProvided[];

    @Type(() => NDCBaggageAllowanceListItem)
    public BaggageAllowanceList: NDCBaggageAllowanceListItem[];

    @Type(() => NDCFareGroup)
    public FareList: NDCFareGroup[];

    @Type(() => NDCFlightSegment)
    public FlightSegmentList: NDCFlightSegment[];

    @Type(() => NDCFlight)
    public FlightList: NDCFlight[];

    @Type(() => NDCPriceClassListItem)
    public PriceClassList: NDCPriceClassListItem[];

    @Type(() => NDCMetadata)
    public Metadata: NDCMetadata;

    @Type(() => NDCServiceDefinition)
    public ServiceDefinitions: NDCServiceDefinition[];
}
