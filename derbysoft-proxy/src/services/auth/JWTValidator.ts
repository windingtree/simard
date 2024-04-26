/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BaseGliderException,
  DidResolutionResponse,
  ErrorCodes,
  HttpRequestError,
  HttpStatusCode,
  getLogger,
  OrgIdAuthResultsRedisCache,
  RestClient,
} from "@simardwt/winding-tree-utils";
import { Inject, Service } from "typedi";
import { Config, ConfigService } from "../common/ConfigService";
import { AxiosError } from "axios";

interface ORGiDValidatorV2Response {
  status: "OK" | "FAILED";
  payload?: {
    aud?: string;
    iss?: string;
  };
  error?: string;
  resolutionResponse?: DidResolutionResponse;
}

interface UnifiedValidationResult {
  status: "OK" | "NOK";
  payload?: {
    aud?: string;
    iss?: string;
  };
  error?: string;
  resolutionResponse?: DidResolutionResponse;
}

@Service()
export class JWTValidator {
  private orgIdAuthResultsCache = new OrgIdAuthResultsRedisCache();
  private env: Config;

  @Inject()
  private restClient: RestClient;
  private log = getLogger(__filename, {
    topic: "auth",
  });

  constructor() {
    this.env = new ConfigService().getConfig() as Config;
    this.log.debug(
      `JWTValidator using ORGid Validator URL:${
        this.env.orgIDValidatorV2.enabled
          ? this.env.orgIDValidatorV2.url
          : this.env.orgIDValidator.url
      }`
    );
  }

  /**
   * Validate JWT.
   * If it's valid and meant for derbysoft-proxy, do nothing.
   * Otherwise throw exception
   * @param jwtToken
   */
  public async validate(jwtToken: string) {
    // check if we have results in cache then return cache data
    let validationResult: UnifiedValidationResult = await this.readFromCache(jwtToken);
    if (!validationResult) {
      this.log.debug(`No previously cached JWT validation result found in cache`);
      try {
        // if we are here, no previously cached results were found
        validationResult = await this.validateJwt(jwtToken);
      } catch (err: any) {
        this.log.error(`Error encountered while make a call to ORGiD validator: ${err.message}`);
        if (err instanceof HttpRequestError) {
          const error = (err.originalError as AxiosError<any, any>).response?.data?.error;
          if (error?.errorCode && error?.httpCode) {
            throw new BaseGliderException(error.httpCode, error.message, error.errorCode);
          }
        }

        throw new BaseGliderException(
          HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR,
          `Unknown error occurred`,
          ErrorCodes.UNKNOWN_ERROR
        );
      }
    }
    // check status
    if (validationResult.status !== "OK") {
      let errorMessage = "Unknown Error";
      if (validationResult.error) {
        if (validationResult.error.includes("signature")) {
          errorMessage = "Invalid signature";
        } else {
          errorMessage = validationResult.error;
        }
      }

      throw new BaseGliderException(
        HttpStatusCode.CLIENT_UNAUTHORIZED,
        `Invalid authorization token: ${errorMessage}`,
        ErrorCodes.INVALID_AUTH_BEARER
      );
    }

    await this.storeInCache(jwtToken, validationResult);
    return validationResult;
  }

  public async getOrgIdJson(orgId: string) {
    return this.resolveOrgId(orgId);
  }

  /**
   * In the interim period where we have ORGiD validator V1 and V2, we need to handle two different response types/schemas
   * This method takes care of V1 vs V2 validation and responses translation to a common format
   */
  private async validateJwt(
    jwtToken: string,
    audience?: string // optional audience till enforced
  ): Promise<UnifiedValidationResult> {
    const v2res: ORGiDValidatorV2Response = await this.validateJwt_v2(jwtToken, audience);
    const response: UnifiedValidationResult = {
      status: v2res?.status === "OK" ? "OK" : "NOK",
      payload: {
        aud: v2res?.payload?.aud,
        iss: v2res?.payload?.iss,
      },
      error: v2res?.error,
      resolutionResponse: v2res.resolutionResponse,
    };

    return response;
  }

  private async validateJwt_v2(
    jwtToken: string,
    audience?: string
  ): Promise<ORGiDValidatorV2Response> {
    const url = `${this.env.orgIDValidatorV2.url}/jwt?jwt=${jwtToken}${
      audience ? `&audience=${audience}` : ""
    }`;
    try {
      return await this.restClient.getCall<ORGiDValidatorV2Response>(
        url,
        {},
        this.env.orgIDValidatorV2.timeoutMillis
      );
    } catch (error) {
      // if this is an ORGiDValidator generated response
      const originalError = ((error as HttpRequestError).originalError as AxiosError)?.response
        ?.data;
      if ((originalError as ORGiDValidatorV2Response)?.status === "FAILED") {
        return originalError as ORGiDValidatorV2Response;
      }

      // this is some other error rethrow
      throw error;
    }
  }

  private async resolveOrgId(orgId: string): Promise<DidResolutionResponse> {
    const url = `${this.env.orgIDValidatorV2.url}/orgId?orgid=${orgId}`;

    const { resolutionResponse } = await this.restClient.getCall<{
      resolutionResponse: DidResolutionResponse;
    }>(url, {}, 10000);

    return resolutionResponse;
  }

  private async storeInCache(key: string, value: any): Promise<void> {
    if (!this.env.redis.cacheEnabled) {
      return;
    }
    try {
      await this.orgIdAuthResultsCache.storeOrgIdResults(key, value);
    } catch (err: any) {
      this.log.error(`Error encountered while storing in redis cache: ${err.message}`);
    }
  }

  private async readFromCache(key: string): Promise<any | undefined> {
    if (!this.env.redis.cacheEnabled) {
      return undefined;
    }
    try {
      return this.orgIdAuthResultsCache.getOrgIdResults(key);
    } catch (err: any) {
      this.log.error(`Error encountered while reading from redis cache: ${err.message}`);
    }
  }
}
