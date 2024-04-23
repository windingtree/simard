import {ChargedAccountDetails} from './types';

export interface BookingFeeManager {
    bookingFeeDescription?: string; // default description
    authorizeAmountFromTokenizedCard(tokenDetails: ChargedAccountDetails, amount: number, currencyCode: string, description?: string, authorizationReference?: string, ...args: any[]): Promise<string|undefined>;
    authorizeToken?(tokenDetails: ChargedAccountDetails): Promise<string>;
    captureCharge(chargeId: string, amount?: number, currencyCode?: string, authorizationReference?: string, ...args: any[]): Promise<boolean>;
    revertCharge(chargeId: string, amount?: number, currencyCode?: string, authorizationReference?: string, ...args: any[]): Promise<boolean>;
}
