// @ts-ignore
import { JWK, JWT } from 'jose';
import {orgIDtoDIDFormat} from './orgIDUtils';

/**
 * Creates JWT token signed with 'ES256K' private key
 * @param issuerOrgID ORGiD of JWT issuer (can be also in DID format)
 * @param audienceOrgID ORGiD of JWT audience (can be also in DID format)
 * @param expiresIn when JWT should expire (e.g. '1 year')
 * @param privKey private key to be used to sign JWT
 * @param keyID private key identifier (e.g. 'webserver')
 */
export const createJWT = (issuerOrgID: string, audienceOrgID: string, expiresIn: string, privKey: string, keyID: string): string => {
    const priv = JWK.asKey(
        privKey,
        {
            alg: 'ES256K',
            use: 'sig',
        }
    );
    const issuerDID = orgIDtoDIDFormat(issuerOrgID);
    const audienceDID = orgIDtoDIDFormat(audienceOrgID);
    const scope = {};
    return JWT.sign(
        {
            ...(scope),
        },
        priv,
        {
            audience: audienceDID,
            ...(issuerDID ? { issuer: `${issuerDID}${keyID ? '#' + keyID : ''}` } : {}),
            expiresIn,
            kid: false,
            header: { typ: 'JWT' },
        }
    );
};

