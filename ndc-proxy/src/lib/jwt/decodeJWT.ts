import {JWT} from 'jose';
import {BaseGliderException} from '../../api/errors';
import {HttpStatusCode} from '../../api/errors';
import {ErrorCodes} from '../../api/errors';

export interface JWTContent {
    expiresIn: string;
    audience: string;
    issuer: string;
    issuerKeyId: string;
    issuerDID: string;

}

export const decodeJWT = (jwt: string): JWTContent => {
    let decodedJWT: JWTContent = undefined;
    try {
        const decodedToken = JWT.decode(jwt, {
            complete: true,
        });
        // @ts-ignore
        const { payload: {exp, aud, iss} } = decodedToken;
        // @ts-ignore
        const { did, fragment } = iss.match(/(?<did>did:orgid:(.*:)?0x\w{64})(?:#{1})?(?<fragment>\w+)?/).groups;
        decodedJWT = {
            audience: aud,
            issuer: iss,
            issuerKeyId: fragment,
            issuerDID: did,
            expiresIn: exp,
        };
    } catch (e: any) {
        throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Cannot decode JWT token:${e.code}`, ErrorCodes.INVALID_JWT_TOKEN);
    }

    return decodedJWT;
};
