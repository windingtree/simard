import {BaseGliderException, ErrorCodes, HttpStatusCode} from '../../api/errors';

export const parseBearerToken = (token: string): string => {
    const regex = new RegExp('Bearer .*');
    if (!regex.test(token)) {
        throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Missing or invalid bearer token`, ErrorCodes.INVALID_AUTH_BEARER);
    }
    const result = token.match(/Bearer (.*)/);
    return result[1];
};
