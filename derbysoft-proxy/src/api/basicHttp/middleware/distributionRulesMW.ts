import { NextFunction, RequestHandler, Response } from "express";
import { EnhancedRequest } from "../../../types/api/common";
import { Config, ConfigService } from "../../../services/common/ConfigService";
import { CustomError } from "../helpers/errorUtils";
import { RestClient, getLogger } from "@simardwt/winding-tree-utils";
import { createDistributionRulesJWT } from "../../../utils/orgIDUtils";
import { SimpleCacheFactory } from "../../../services/common/SimpleCacheFactory";

export interface VerificationResult {
  isVerified: boolean;
  matchedRule?: unknown;
  isGlobalDefault?: boolean;
}

type DistribuionRulesVerifyResponse = {
  data: VerificationResult;
  message?: string;
};

export const distributionRulesMW: RequestHandler = async (
  req: EnhancedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // check if distribution rules is enabled
    const env = new ConfigService().getConfig() as Config;
    if (!env.distributionRules.enabled) {
      return next();
    }

    const log = getLogger(__filename);

    // pass JWT token across to distribution rules verify endpoint
    if (!/Bearer\s(\S+)/.test(req.headers.authorization)) {
      throw new CustomError(401, "Invalid token in authorization header - No Bearer Token found");
    }
    //const jwt = req.headers.authorization.match(/Bearer\s(\S+)/)[1];

    if (!req.sessionContext) {
      throw new Error(
        "No session context found. Ensure you are using the AuthMW before distribution rules"
      );
    }

    const supplierOrgId = req.sessionContext.supplierOrgId;

    // get JWT (iss: providerOrgId, aud: simardOrgId) from cache or create new one
    const stringCacheService = SimpleCacheFactory.getCacheService("string");
    let jwt = stringCacheService.get(supplierOrgId);
    if (!jwt) {
      // create new JWT for distribution rules
      jwt = await createDistributionRulesJWT(supplierOrgId);
    }

    // check if allowed or not
    const client = new RestClient();
    try {
      const baseUrl = env.distributionRules.url;
      const response = await client.getCall<DistribuionRulesVerifyResponse>(
        `${baseUrl}/distribution-rules/verifyBuyer/${req.sessionContext.clientOrgId}`,
        {
          Authorization: `Bearer ${jwt}`,
        },
        5000
      );

      if (!response.data?.isVerified) {
        // get the supplier info
        const { supplierName } = env.derbysoft.suppliers[supplierOrgId];
        throw new CustomError(
          401,
          `Invalid buyer ${
            req.sessionContext.clientName
              ? `'${req.sessionContext.clientName}'`
              : `OrgId - '${req.sessionContext.clientOrgId}}'`
          } to supplier '${supplierName}'`
        );
      }

      return next();
    } catch (error) {
      log.error((error as Error).message);
      throw error;
    }
  } catch (error) {
    next(error);
  }
};
