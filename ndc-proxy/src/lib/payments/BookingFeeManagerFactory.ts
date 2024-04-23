import Container, { Service } from 'typedi';
import { BookingFeeChargeProvider } from '../../services/bre/BusinessRulesEngine';
import { StripeBookingFeeManager } from './StripeBookingFeeManager';
import { DataTransBookingFeeManager } from './DataTransBookingFeeManager';
import { BaseGliderException, ErrorCodes, HttpStatusCode } from '../../api/errors';
import { LoggerFactory } from '../logger';
import { BookingFeeManager } from './BookingFeeManager';

@Service()
export class BookingFeeManagerFactory {
    private log = LoggerFactory.createLogger('booking fee manager factory');

    public getBookingFeeManager(bookingFeeChargeProvider: BookingFeeChargeProvider): BookingFeeManager {
        if (bookingFeeChargeProvider === 'STRIPE') {
            return Container.get<StripeBookingFeeManager>(StripeBookingFeeManager);
        } else if (bookingFeeChargeProvider === 'DATATRANS') {
            return Container.get<DataTransBookingFeeManager>(DataTransBookingFeeManager);
        } else {
            // we return a stub that throws errors if attempted to use
            return {
                authorizeAmountFromTokenizedCard: () => {
                    this.log.error('Booking fee manager error: No Booking fee manager set');
                    throw new BaseGliderException(HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR, 'Booking fee manager not set', ErrorCodes.INVALID_PAYMENT_PROVIDER_DETAILS);
                },
                captureCharge: () => {
                    this.log.error('Booking fee manager error: No Booking fee manager set');
                    throw new BaseGliderException(HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR, 'Booking fee manager not set', ErrorCodes.INVALID_PAYMENT_PROVIDER_DETAILS);
                },
                revertCharge: () => {
                    this.log.error('Booking fee manager error: No Booking fee manager set');
                    throw new BaseGliderException(HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR, 'Booking fee manager not set', ErrorCodes.INVALID_PAYMENT_PROVIDER_DETAILS);
                },
            };
        }
    }
}
