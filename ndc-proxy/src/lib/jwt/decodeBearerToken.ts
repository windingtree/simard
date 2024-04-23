import {decodeJWT, JWTContent} from './decodeJWT';
import {parseBearerToken} from './parseBearerToken';

export const decodeBearerToken = async (bearerToken: string): Promise<JWTContent> => {
    const jwt = parseBearerToken(bearerToken);
    return await decodeJWT(jwt);
};
