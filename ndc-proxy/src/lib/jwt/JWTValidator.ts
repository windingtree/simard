import {env} from '../../env';
import {BaseGliderException, ErrorCodes, HttpStatusCode} from '../../api/errors';
import {Inject, Service} from 'typedi';
import {OrgIdAuthResultsRedisCache} from '../cache/OrgIdAuthResultsRedisCache';
import {RestClient} from '../webservices';
import {JWTContent} from './decodeJWT';
import {LoggerFactory} from '../logger';

interface Error {
    httpCode: number;
    message: string;
    errorCode: string;
}

interface ORGiDValidatorV1Response {
    status: 'OK' | 'NOK';
    payload?: JWTContent;
    error?: Error;
}
interface ORGiDValidatorV2Response {
    status: 'OK'|'FAILED';
    payload?: {
        aud?: string;
        iss?: string;
    };
    error?: string;
}

interface UnifiedValidatonResult {
    status: 'OK' | 'NOK';
    payload?: {
        aud?: string;
        iss?: string;
    };
    error?: string;
}

@Service()
export class JWTValidator {

    @Inject()
    private orgIdAuthResultsCache: OrgIdAuthResultsRedisCache;

    @Inject()
    private restClient: RestClient;
    private log = LoggerFactory.createLogger('auth');

    /**
     * Validate JWT.
     * If it's valid and meant for NDC Proxy, do nothing.
     * Otherwise throw exception
     * @param jwtToken
     */
    public async validate(jwtToken: string): Promise<void> {
        if (env.orgID.jwtValidationEnabled === false) {
            this.log.warn('Warning! JWT validation is disabled at all');
            return;
        }
        // check if we have results in cache then return cache data
        let validationResult: UnifiedValidatonResult = await this.readFromCache(jwtToken);
        if (validationResult === undefined) {
            this.log.debug(`No previously cached JWT validation result found in cache`);
            try {
                // if we are here, no previously cached results were found
                validationResult = await this.validateJwt(jwtToken, env.app.aggregatorOrgId);
                await this.storeInCache(jwtToken, validationResult);
            } catch (err: any) {
                this.log.error(`Error encountered while make a call to ORGiD validator: ${err.message}`);
                throw new BaseGliderException(HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR, `Unknown error occurred`, ErrorCodes.UNKNOWN_ERROR);
            }
        }
        // check status
        if (validationResult.status !== 'OK') {
            let errorMessage = '';
            if (validationResult.error) {
                errorMessage = validationResult.error;
            }
            throw new BaseGliderException(HttpStatusCode.CLIENT_FORBIDDEN, `Invalid authorization:${errorMessage}`, ErrorCodes.INVALID_AUTH_BEARER);
        }
       /* // check if audience field is ndc proxy ORGiD
        if (validationResult.payload.aud !== `did:orgid:${env.app.aggregatorOrgId}`) {
            this.log.warn(`Received valid JWT but audience ORGiD is not NDC Proxy (got:${validationResult.payload.aud}, expected:${env.app.aggregatorOrgId}`);
            throw new BaseGliderException(HttpStatusCode.CLIENT_FORBIDDEN, `JWT is not for NDC Proxy`, ErrorCodes.INVALID_AUTH_BEARER);
        }*/
    }

    /**
     * In the interim period where we have ORGiD validator V1 and V2, we need to handle two different response types/schemas
     * This method takes care of V1 vs V2 validation and responses translation to a common format
     */
    private async validateJwt(jwtToken: string, audience: string): Promise<UnifiedValidatonResult> {
        let response: UnifiedValidatonResult;
        if (env.orgIDValidatorV2.enabled === true) {
            const v1res: ORGiDValidatorV2Response = await this.validateJwt_v2(jwtToken, audience);
            response = {
                status: v1res?.status === 'OK' ? 'OK' : 'NOK',
                payload: {
                    aud: v1res?.payload?.aud,
                    iss: v1res?.payload?.iss,
                },
                error: v1res?.error,
            };
        } else {
            const v2res: ORGiDValidatorV1Response = await this.validateJwt_v1(jwtToken, audience);
            response = {
                status: v2res?.status === 'OK' ? 'OK' : 'NOK',
                payload: {
                    aud: v2res?.payload?.audience,
                    iss: v2res?.payload?.issuer,
                },
                error: v2res?.error?.message,
            };
        }
        return response;
    }

    private async validateJwt_v1(jwtToken: string, audience: string): Promise<ORGiDValidatorV1Response> {
        const url = `${env.orgIDValidator.url}/jwt?jwt=${jwtToken}&audience=${audience}`;
        return await this.restClient.getCall<ORGiDValidatorV1Response>(url, {}, env.orgIDValidator.timeoutMillis);
    }
    private async validateJwt_v2(jwtToken: string, audience: string): Promise<ORGiDValidatorV2Response> {
        const url = `${env.orgIDValidatorV2.url}/jwt?jwt=${jwtToken}&audience=${audience}`;
        return await this.restClient.getCall<ORGiDValidatorV2Response>(url, {}, env.orgIDValidator.timeoutMillis);
    }

    private async storeInCache(key: string, value: any): Promise<void> {
        if (!env.redis.cacheEnabled) {
            return;
        }
        try {
            await this.orgIdAuthResultsCache.storeOrgIdResults(this.createCacheKey(key), value);
        } catch (err: any) {
            this.log.error(`Error encountered while storing in redis cache: ${err.message}`);
        }
    }
    // @ts-ignore
    private async readFromCache(key: string): Promise<any|undefined> {
        if (!env.redis.cacheEnabled) {
            return undefined;
        }
        try {
            return await this.orgIdAuthResultsCache.getOrgIdResults(this.createCacheKey(key));
        } catch (err: any) {
            this.log.error(`Error encountered while reading from redis cache: ${err.message}`);
        }
    }
    private createCacheKey(key: string): string {
        return `${env.redis.keyPrefix}-${key}`;
    }
}
