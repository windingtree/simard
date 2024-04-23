import {FarelogixConfiguration} from '../env';
import {SessionContext} from './SessionContext';
import { BookingFeeChargeProvider } from './bre/BusinessRulesEngine';
import {GuaranteeType} from './bre/GuaranteeType';

export interface ExtendedSessionContext extends SessionContext, FarelogixConfiguration  {

    depositType?: GuaranteeType;     // what is the payment flow (token vs deposit/guarantee)

    // booking fee related
    isBookingFeeRequired?: boolean;
    bookingFeeCurrencyCode?: string;
    bookingFeeAmount?: number;
    bookingFeeChargeProvider?: BookingFeeChargeProvider;

    isDBFEnabled?: boolean; // should DBF be requested (UA)
}
