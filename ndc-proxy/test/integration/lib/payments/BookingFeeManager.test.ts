import {Container} from 'typedi';
import {bootstrapDIContext} from '../../../testutils/bootstrapDIContext';
import {ChargedAccountDetails, BookingFeeManager, DataTransBookingFeeManager} from '../../../../src/lib/payments';
import {tokenizeCreditCard} from './tokenizeCreditCard';
import {SimardClient} from '../../../../src/lib/simard';
import {testenv} from '../../../../src/env';
import {SMDTokenDetails} from '../../../../src/interfaces/simard';
import { StripeBookingFeeManager } from '../../../../src/lib/payments/StripeBookingFeeManager';
import { BookingFeeChargeProvider } from '../../../../src/services/bre/BusinessRulesEngine';
import crypto from 'crypto';

type Card = {
    card: string;
    csv: string;
    expiryYear: string;
    expiryMonth: string;
    country: string;
    cardholderName: string;
    billingAddress: any;
}

const STRIPE_CARD: Card = {
    card: '4242424242424242',
    csv: '737',
    expiryYear: '2030',
    expiryMonth: '03',
    country: 'NL',
    cardholderName: 'John Doe',
    billingAddress: {
        'countryCode': 'US',
        'stateProv': 'FL',
        'postalCode': '10114',
        'cityName': 'MIAMI',
        'street': '1 CIRCLE ROAD',
    },
};

const DATATRANS_CARD: Card = {
    card: '5404000000000001',
    csv: '123',
    expiryYear: '2025',
    expiryMonth: '06',
    country: 'US',
    cardholderName: 'John Doe',
    billingAddress: {
        'countryCode': 'US',
        'stateProv': 'FL',
        'postalCode': '10114',
        'cityName': 'MIAMI',
        'street': '1 CIRCLE ROAD',
    },
};

jest.setTimeout(30000);
type FeeManager = {
    feeMgr: BookingFeeManager;
    bookingFeeChargeProvider: BookingFeeChargeProvider;
    card: Card;
};

const feeManagers: FeeManager[] = [
    {
        feeMgr: Container.get<StripeBookingFeeManager>(StripeBookingFeeManager), 
        bookingFeeChargeProvider: "STRIPE",
        card: STRIPE_CARD
    },
    {
        feeMgr: Container.get<DataTransBookingFeeManager>(DataTransBookingFeeManager), 
        bookingFeeChargeProvider: "DATATRANS",
        card: DATATRANS_CARD
    },
];

const createTokenForTestCreditCard = async (cCard: Card): Promise<SMDTokenDetails> => {
    const simardClient: SimardClient = Container.get<SimardClient>(SimardClient);
    const secureTransactionID = await tokenizeCreditCard(cCard.card, cCard.csv);
    console.log(`secureTransactionID=${secureTransactionID}`);
    expect(secureTransactionID).not.toBeUndefined();
    const receiverOrgId = testenv.gliderOTAOrgId;
    const token: SMDTokenDetails = await simardClient.createToken(receiverOrgId, secureTransactionID, cCard.cardholderName, cCard.expiryMonth, cCard.expiryYear, cCard.billingAddress);
    console.log(`token=${JSON.stringify(token)}`);
    return token;
};

describe('BookingFeeManager', () => {
    beforeAll(() => {
        bootstrapDIContext();
    });
    // skip this test as it's actually making a call to stripe and pciProxy
    test.skip.each(feeManagers)('should charge 2.5$ successfully - $bookingFeeChargeProvider', async ({feeMgr}) => {
        const tokenDetails: ChargedAccountDetails = {
            aliasAccountNumber: 'AAABf3BRFSPssdexyrAAAfgVnS8uAFHS',
            aliasCvv: 'P2oaDtZpSTGa8IkETxvSVzI4',
            expiryMonth: '01',
            expiryYear: '2039',
        };
        const result = await feeMgr.authorizeAmountFromTokenizedCard(tokenDetails, 250, 'USD', 'Booking fee');
        expect(result).toEqual(true);
    });
    
    test.each(feeManagers)('authorize and capture - $bookingFeeChargeProvider', async ({feeMgr, card}) => {
        const token: SMDTokenDetails = await createTokenForTestCreditCard(card);
        expect(token.id).not.toBeUndefined();
        const tokenDetails: ChargedAccountDetails = {
            aliasAccountNumber: token.aliasAccountNumber,
            aliasCvv: token.aliasCvv,
            expiryMonth: token.expiryMonth,
            expiryYear: token.expiryYear,
        };
        const refNo = crypto.randomUUID();
        const chargeID = await feeMgr.authorizeAmountFromTokenizedCard(tokenDetails, 250, 'USD', 'Booking fee', refNo);
        expect(chargeID).not.toBeUndefined();
        const wasCharged = await feeMgr.captureCharge(chargeID, 250, 'USD', refNo);
        expect(wasCharged).toBe(true);
    });

    test.each(feeManagers)('authorize and revert - $bookingFeeChargeProvider', async ({feeMgr, card}) => {
        const token: SMDTokenDetails = await createTokenForTestCreditCard(card);
        expect(token.id).not.toBeUndefined();
        const tokenDetails: ChargedAccountDetails = {
            aliasAccountNumber: token.aliasAccountNumber,
            aliasCvv: token.aliasCvv,
            expiryMonth: token.expiryMonth,
            expiryYear: token.expiryYear,
        };
        const refNo = crypto.randomUUID();
        const chargeID = await feeMgr.authorizeAmountFromTokenizedCard(tokenDetails, 250, 'USD', 'Booking fee', refNo);
        expect(chargeID).not.toBeUndefined();
        const wasCharged = await feeMgr.revertCharge(chargeID, 250, 'USD', refNo);
        expect(wasCharged).toBe(true);
    });


});
