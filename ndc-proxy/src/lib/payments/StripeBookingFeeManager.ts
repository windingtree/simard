import { Inject, Service } from 'typedi';
import { env } from '../../env';
import { RestClient } from '../webservices';
import { ChargedAccountDetails } from './types';
import { LoggerFactory } from '../logger';
import { BookingFeeManager } from './BookingFeeManager';
import Stripe from 'stripe';

const stripe = new Stripe(env.stripe.key, {
    apiVersion: '2023-10-16',
});

@Service()
export class StripeBookingFeeManager implements BookingFeeManager {
    public readonly bookingFeeDescription = env.stripe.bookingFeeDescription;
    @Inject()
    private restClient: RestClient;
    private log = LoggerFactory.createLogger('stripe booking fee manager');

    public async authorizeToken(tokenDetails: ChargedAccountDetails): Promise<string> {
        return this.authorizeAmountFromTokenizedCard(tokenDetails, env.stripe.bookingFeeAmount, env.stripe.bookingFeeCurrency, env.stripe.bookingFeeDescription);
    }

    /**
     * Authorize amount(using stripe API) for a tokenized card
     * Returns chargeID which is needed to capture authorized amount or to refund it
     * @param tokenDetails
     * @param amount
     * @param currencyCode
     * @param description
     */
    public async authorizeAmountFromTokenizedCard(tokenDetails: ChargedAccountDetails, amount: number, currencyCode: string, description: string): Promise<string | undefined> {
        this.log.debug(`Authorize booking fee, amount:${amount}${currencyCode}, aliasAccountNumber:${tokenDetails.aliasAccountNumber}`);
        const pciBody = `card[number]=${tokenDetails.aliasAccountNumber}&card[exp_month]=${tokenDetails.expiryMonth}&card[exp_year]=${tokenDetails.expiryYear}&card[cvc]=${tokenDetails.aliasCvv}`;
        const pciHeaders = {
            'x-cc-merchant-id': env.pciproxy.merchantID,
            'pci-proxy-api-key': env.pciproxy.apiKey,
            'x-cc-url': env.stripe.url,
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${env.stripe.key}`,
        };
        try {
            // make a call to stripe (using PCI proxy) and provide card details
            const response = await this.restClient.postCall<any>(env.pciproxy.url, pciHeaders, pciBody, 10000);
            const stripeBody = {
                amount,
                currency: currencyCode,
                source: response.id,
                description: 'EY Booking fee',
                statement_descriptor_suffix: description,
                capture: false,
            };
            // authorize amount using stripe
            const stripeResp = await stripe.charges.create(stripeBody);
            return stripeResp.id;
        } catch (err) {
            this.log.error(`Failed to authorize amount, card alias ${tokenDetails.aliasAccountNumber}, error:${err}`);
            return undefined;
        }
    }

    public async captureCharge(chargeId: string): Promise<boolean> {
        this.log.debug(`Capture previously authorized booking fee, chargeID:${chargeId}`);
        try {
            await stripe.charges.capture(chargeId);
            return true;
        } catch (err) {
            this.log.error(`Failed to capture amount, chargeID ${chargeId}, error:${err}`);
            return false;
        }
    }

    public async revertCharge(chargeId: string): Promise<boolean> {
        this.log.debug(`Refund previously authorized booking fee, chargeID:${chargeId}`);
        try {
            await stripe.refunds.create({ charge: chargeId });
            return true;
        } catch (err) {
            this.log.error(`Failed to refund amount, chargeID ${chargeId}, error:${err}`);
            return false;
        }
    }
}
