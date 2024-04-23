import {SMDCardBrand} from './SMDCardBrand';
import {SMDCardType} from './SMDCardType';
import {SMDBillingAddress} from './SMDBillingAddress';

export interface SMDTokenDetails {
    id: string;
    creatorOrgId: string;
    receiverOrgId: string;
    brand: SMDCardBrand;
    aliasAccountNumber: string;
    maskedAccountNumber: string;
    expiryMonth: string;
    expiryYear: string;
    aliasCvv: string;
    type: SMDCardType;
    cardholderName: string;
    billingAddress: SMDBillingAddress;
    amount?: string;
    currency?: string;
}
