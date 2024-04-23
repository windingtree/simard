import {SMDBillingAddress} from './SMDBillingAddress';

export interface SMDTokenCreatePayload {
    receiverOrgId: string;
    secureFieldTransactionId: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    billingAddress: SMDBillingAddress;
}
