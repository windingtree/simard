import { OrgJsonReference } from "@windingtree/org.json-schema/types/org.json";
import { NextFunction, RequestHandler, Response } from "express";
import Container from "typedi";
import { JWTValidator } from "../../../services/auth/JWTValidator";
import { Config, ConfigService } from "../../../services/common/ConfigService";
import { EnhancedRequest } from "../../../types/api/common";
import { CustomError } from "../helpers/errorUtils";
import { extractOrgIdCountryCode, extractOrgIdName } from "../../../utils/orgIDUtils";

/**
 * Auth Middleware that validates JWT in request header, extracts relevant metadata
 * and attaches relevant metadata to th request object
 * @param req HTTP request object
 * @param res HTTP response object
 * @param next Next function
 * @returns void
 */
export const authMW: RequestHandler = async (
  req: EnhancedRequest,
  res: Response,
  next: NextFunction
) => {
  // extract JWT from auth header
  try {
    const env = new ConfigService().getConfig() as Config;
    if (!env.orgIDValidator.enabled && !env.orgIDValidatorV2.enabled) {
      // skip authentication
      return next(new Error("orgIdValidator must be enabled in ENV"));
    }

    if (!/Bearer\s(\S+)/.test(req.headers.authorization)) {
      throw new CustomError(401, "Invalid token in authorization header - No Bearer Token found");
    }
    const jwt = req.headers.authorization.match(/Bearer\s(\S+)/)[1];
    const jwtValidator: JWTValidator = Container.get<JWTValidator>(JWTValidator);
    const { payload, resolutionResponse } = await jwtValidator.validate(jwt);

    // get orgJSON details of supplier (aud) - OrgIDValidator returns issuer details
    if (!payload.aud) {
      throw new CustomError(401, "No audience found in JWT payload");
    }

    const orgJson = await jwtValidator.getOrgIdJson(payload.aud);
    const orgDetails: OrgJsonReference = orgJson.didDocument;

    // get supplier country code
    const supplierCountryCode = extractOrgIdCountryCode(orgDetails);

    // get supplierId from suppliers.json
    const supplier = payload.aud && env.derbysoft.suppliers[payload.aud];
    if (!supplier) {
      throw new CustomError(401, `Invalid supplier - Supplier with OrgId ${payload.aud} not found`);
    }

    const supplierId = supplier.supplierId;
    if (!supplierId) {
      throw new CustomError(
        401,
        `Invalid supplier - No supplierId found for supplier with OrgId ${payload.aud}`
      );
    }

    // TO-DO: we may have to reject OrgIDs without country code
    req.sessionContext = {
      clientOrgId: payload.iss,
      clientName: extractOrgIdName(resolutionResponse.didDocument),
      supplierOrgId: payload.aud,
      supplierId,
      supplierCountryCode,
    };

    next();
  } catch (error) {
    return next(error);
  }
};
