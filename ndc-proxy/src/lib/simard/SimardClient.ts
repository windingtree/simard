import {Inject, Service} from 'typedi';
import {env} from '../../env';
import {RestClient} from '../webservices';
import {
    SMDGuaranteeDetails,
    SMDTokenDetails,
    SMDTokenCreatePayload,
    SMDBillingAddress,
    SMDGuaranteeID,
    SMDSettlement,
    SMDCard,
    ClaimWithCardResponse,
    SMDTravelComponentPayloadItem, SMDTravelComponentPayload
} from '../../interfaces/simard';
import {SimpleTimeEvictionBasedCache} from '../cache';
import {createJWT} from '../jwt';
import {BaseGliderException, HttpStatusCode, ErrorCodes} from '../../api/errors';
import {LoggerFactory, logMessage} from '../logger';

const SIMARD_JWT_EXPIRY_TIME_IN_DAYS = 7;
const MILLIS_IN_A_DAY = 24 * 60 * 60 * 1000;

/**
 * Wrapper class/client for Simard API
 * It takes care of JWT token generation (JWT is generated and cached for configured time, regenerated after it expires)
 *
 */
@Service()
export class SimardClient {
    // in integration tests we need to override issuer (e.g. to simulate other client is making a call to Simard), hence we need setters which should only work in TEST env
    set issuerPrivateKeyID(value: string) {
        // throw error if someone wants to override property in a non-test environment
        this.ensurePropertyCanBeChangedOnlyInTestEnvironment('issuerPrivateKeyID');
        this._issuerPrivateKeyID = value;
        this.tokenCache.clearCache();   // clear JWT token cache since to ensure new token will be created
    }
    get issuerPrivateKeyID(): string {
        return this._issuerPrivateKeyID;
    }
    set issuerPrivateKey(value: string) {
        // throw error if someone wants to override property in a non-test environment
        this.ensurePropertyCanBeChangedOnlyInTestEnvironment('issuerPrivateKey');
        this._issuerPrivateKey = value;
        this.tokenCache.clearCache();   // clear JWT token cache since to ensure new token will be created
    }
    get issuerPrivateKey(): string {
        return this._issuerPrivateKey;
    }
    set issuerOrgId(value: string) {
        // throw error if someone wants to override property in a non-test environment
        this.ensurePropertyCanBeChangedOnlyInTestEnvironment('issuerOrgId');
        this._issuerOrgId = value;
        this.tokenCache.clearCache();   // clear JWT token cache since to ensure new token will be created
    }
    get issuerOrgId(): string {
        return this._issuerOrgId;
    }

    @Inject()
    private restClient: RestClient;

    // cache Simard JWT tokens for 1 day less than JWT token expiry date is set inside JWT...just to avoid corner cases
    private tokenCache = new SimpleTimeEvictionBasedCache<string, string>((SIMARD_JWT_EXPIRY_TIME_IN_DAYS - 1) * MILLIS_IN_A_DAY);

    private _issuerOrgId: string = env.app.aggregatorOrgId;
    private audienceOrgId: string = env.simardPay.orgId;
    private _issuerPrivateKey: string = env.app.aggregatorPrivateKey;
    private _issuerPrivateKeyID: string = env.app.aggregatorPrivateKeyID;
    private log = LoggerFactory.createLogger('simard-pay');

    // ******************  GUARANTEES ******************
    /**
     * Retrieve guarantee details
     * @param guaranteeId
     */
    public async getGuarantee(guaranteeId: string): Promise<SMDGuaranteeDetails> {
        const url = `${env.simardPay.url}/balances/guarantees/${guaranteeId}`;
        return await this.restClient.getCall<SMDGuaranteeDetails>(url, this.getHeaders(), env.simardPay.timeoutMillis);
    }

    /**
     * Create a guarantee for a given orgId
     * @param amount
     * @param currencyCode
     * @param creditorOrgId
     */
    public async createGuarantee(amount: number, currencyCode: string, creditorOrgId: string): Promise<SMDGuaranteeID> {
        const url = `${env.simardPay.url}/balances/guarantees`;
        const body = {
            currency: currencyCode,
            'amount': amount,
            'creditorOrgId': creditorOrgId,
            'expiration': new Date(Date.now() + 60 * 1000 * 60 * 24 * 1),
        };
        this.log.info(`Create guarantee, creditorOrgId:${creditorOrgId}, amount:${amount} ${currencyCode}`);
        return await this.restClient.postCall<SMDGuaranteeID>(url, this.getHeaders(), body, env.simardPay.timeoutMillis);
    }
    public async cancelGuarantee(guaranteeId: string): Promise<void> {
        const url = `${env.simardPay.url}/balances/guarantees/${guaranteeId}`;
        await this.restClient.deleteCall(url, this.getHeaders(), env.simardPay.timeoutMillis);
    }

    /**
     * Claim the guarantee
     * @param guaranteeId
     */
    public async claimGuarantee(guaranteeId: string): Promise<SMDSettlement> {
        const url = `${env.simardPay.url}/balances/guarantees/${guaranteeId}/claim`;
        this.log.info(`Claim guarantee, guaranteeId:${guaranteeId}`);
        return await this.restClient.postCall<SMDSettlement>(url, this.getHeaders(), {}, env.simardPay.timeoutMillis);
    }

    // ******************  CARDS  ******************

    public async createVirtualCard(amount: number, currencyCode: string): Promise<SMDCard> {
        const url = `${env.simardPay.url}/cards`;
        const body = {
            amount,
            currency: currencyCode,
            expiration: new Date(Date.now() + 60 * 1000 * 60 * 24 * env.simardPay.virtualCardExpiryDays),
        };
        this.log.info(`Create virtual card guarantee, amount:${amount} ${currencyCode}`);
        return await this.restClient.postCall<SMDCard>(url, this.getHeaders(), body, env.simardPay.timeoutMillis);
    }

    // Claim the guarantee
    public async claimGuaranteeWithCard(guaranteeId: string): Promise<ClaimWithCardResponse> {
        const url = `${env.simardPay.url}/balances/guarantees/${guaranteeId}/claimWithCard`;
        const body = {
            expiration: new Date(Date.now() + 60 * 1000 * 60 * 24 * env.simardPay.virtualCardExpiryDays),
        };
        this.log.info(`Claim guarantee with virtual card`);
        return await this.restClient.postCall<ClaimWithCardResponse>(url, this.getHeaders(), body, env.simardPay.timeoutMillis);
    }

    public async deleteVirtualCard(cardId: string): Promise<void> {
        const url = `${env.simardPay.url}/cards/${cardId}`;
        await this.restClient.deleteCall(url, this.getHeaders(), env.simardPay.timeoutMillis);
    }

    public async refundSettlement(settlementId: string, amount: number, currency: string): Promise<SMDSettlement> {
        const url = `${env.simardPay.url}/balances/refund`;
        const body = {
            currency,
            amount,
            settlementId,
        };
        return await this.restClient.postCall<SMDSettlement>(url, this.getHeaders(), body, env.simardPay.timeoutMillis);
    }

    // ******************  TOKENS  ******************

    // create token (store non-secure card details + billing address)
    public async createToken(receiverOrgId: string, secureFieldTransactionId: string, cardholderName: string, expiryMonth: string, expiryYear: string, billingAddress: SMDBillingAddress): Promise<SMDTokenDetails> {
        const url = `${env.simardPay.url}/tokens`;
        const body: SMDTokenCreatePayload = {
            receiverOrgId,
            secureFieldTransactionId,
            cardholderName,
            expiryMonth,
            expiryYear,
            billingAddress,
        };
        await logMessage('simard_createToken', JSON.stringify(body), 'json');
        this.log.info(`Create token, receiverOrgId:${receiverOrgId}`);
        return await this.restClient.postCall<SMDTokenDetails>(url, this.getHeaders(), body, env.simardPay.timeoutMillis);
    }
    public async retrieveToken(tokenId: string): Promise<SMDTokenDetails> {
        const url = `${env.simardPay.url}/tokens/${tokenId}`;
        return await this.restClient.getCall<SMDTokenDetails>(url, this.getHeaders(), env.simardPay.timeoutMillis);
    }

    // create token (store non-secure card details + billing address)
    public async createTokenComponents(tokenId: string, components: SMDTravelComponentPayloadItem[]): Promise<boolean> {
        const url = `${env.simardPay.url}/tokens/${tokenId}/travel-components`;
        const body: SMDTravelComponentPayload = components;
        await logMessage('simard_travel-componentsRQ', JSON.stringify(body), 'json');
        this.log.info(`Create travel components, tokenId:${tokenId}`);
        const response = await this.restClient.postCall<SMDTravelComponentPayload>(url, this.getHeaders(), body, env.simardPay.timeoutMillis);
        await logMessage('simard_travel-componentsRS', JSON.stringify(response), 'json');
        return Array.isArray(response) && response.length === components.length;        // return true only if response is correct (same as payload)
    }

    // **************** TEST METHODS  ****************

    // simulate deposit (only in TEST env)
    public async simulateDeposit(amount: number, currency: string): Promise<SMDSettlement> {
        const url = `${env.simardPay.url}/balances/simulateDeposit`;
        const body = {
            currency,
            amount,
        };
        return await this.restClient.postCall<SMDSettlement>(url, this.getHeaders(), body, env.simardPay.timeoutMillis);
    }

    // simulate deposit (only in TEST env)
    public async getBalances(): Promise<any> {
        const url = `${env.simardPay.url}/balances`;
        return await this.restClient.getCall(url, this.getHeaders(), env.simardPay.timeoutMillis) ;
    }

    private getHeaders(): any {
        return {
            Authorization: `Bearer ${this.getSimardJWT()}`,
        };
    }

    // get JWT token to be used with a call to Simard (headers)
    // it will either generate it or retrieve it from cache
    private getSimardJWT(): string {
        let token = this.tokenCache.get('JWT');
        if (!token) {
           token = this.generateSimardJWT();
           this.tokenCache.put('JWT', token);
        }
        this.log.info('JWT Token for simard:' + token);
        return token;
    }

    // generate JWT token for Simard
    private generateSimardJWT(): string {
        try {
            return createJWT(this._issuerOrgId, this.audienceOrgId, `${SIMARD_JWT_EXPIRY_TIME_IN_DAYS} days`, this._issuerPrivateKey, this._issuerPrivateKeyID );
        } catch (err: any) {
            this.log.error(`Failed to generate Simard JWT token, error message:${err.message}, aggregator orgID:${(this._issuerOrgId)}, simard orgID:${(this.audienceOrgId)}`);
            throw new BaseGliderException(HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR, `Failed to generate Simart JWT`, ErrorCodes.UNKNOWN_ERROR);
        }
    }
    private ensurePropertyCanBeChangedOnlyInTestEnvironment(propertyName: string): void {
        if (!env.isTest) {
            throw new Error(`Property ${propertyName} can be only overwritten in TEST environment, for test purposes only`);
        }
    }
}
