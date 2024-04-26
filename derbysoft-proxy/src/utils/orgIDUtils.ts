import { createJWT } from "@simardwt/winding-tree-utils";
import { OrgJsonReference } from "@windingtree/org.json-schema/types/org.json";
import { Config, ConfigService } from "../services/common/ConfigService";
import { CustomError } from "../api/basicHttp/helpers/errorUtils";

export const createSimardPayJWT = async () => {
  const env = new ConfigService().getConfig() as Config;
  const issuerId = env.app.aggregatorOrgId;
  const audienceId = env.simard.simardOrgId;
  const keyId = env.app.aggregatorPrivateKeyID;
  const key = env.app.aggregatorPrivateKey;
  const expiresIn = "24 weeks";

  const jwt = await createJWT(issuerId, audienceId, expiresIn, key, keyId);
  // eslint-disable-next-line no-console
  console.log(jwt);

  return jwt;
};

export const createDistributionRulesJWT = async (providerOrgId: string) => {
  const env = new ConfigService().getConfig() as Config;

  /* 
  TO-DO: final implementation of JWT implement creation after thorough investigation  
  const issuerId = providerOrgId;
  const audienceId = env.simard.simardOrgId;
  const keyId = env.app.aggregatorPrivateKeyID;
  const key = env.app.aggregatorPrivateKey;
  const expiresIn = "24 hours";

  const jwt = await createJWT(issuerId, audienceId, expiresIn, key, keyId); */

  // TO-DO: temp solution, store and retrieve static JWT from suppliers.json
  const suppliers = env.derbysoft.suppliers;
  const supplier = suppliers[providerOrgId];
  if (!supplier) {
    throw new CustomError(400, `Distribution rules: Invalid supplier orgId - ${providerOrgId}`);
  }

  const jwt = supplier.distributionRulesJwt;
  if (!jwt) {
    throw new Error(
      `Distribution rules JWT creation: No static JWT found for supplier - ${supplier.supplierId}`
    );
  }

  // eslint-disable-next-line no-console
  console.log(jwt);

  return jwt;
};

export const extractOrgIdCountryCode = (document?: OrgJsonReference) => {
  if (!document) return undefined;
  return (
    document.legalEntity?.registeredAddress?.country ?? document.organizationalUnit.address.country
  );
};

export const extractOrgIdName = (document?: OrgJsonReference) => {
  if (!document) return undefined;
  return document.legalEntity?.legalName ?? document.organizationalUnit?.name;
};
