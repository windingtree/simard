import {decodeBearerToken} from '../../../../src/lib/jwt/decodeBearerToken';
const validJWT = 'abcdefg.abdcdef';
const invalidJWT = 'aa.bb.cc';

const createBearerTokenHeader = (jwt: string) => `Bearer ${jwt}`;

describe('decodeBearerToken', () => {
    it('should decode bearer token header correctly if the token and header format is correct', async(done) => {
        const jwt = await decodeBearerToken(createBearerTokenHeader(validJWT));
        expect(jwt).not.toBeUndefined();
        expect(jwt.audience).toEqual('did:orgid:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
        expect(jwt.issuer).toEqual('did:orgid:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa#webserver');
        done();
    });

    it('should throw error on invalid bearer token (JWT token OK but the format of HTTP Auth header is invalid', async(done) => {
        expect(async () => await decodeBearerToken(`XXXXXXXXXXXXXXXXXXXXXx${validJWT}`)).rejects.toThrowError('Missing or invalid bearer token');
        expect(async () => await decodeBearerToken(`${validJWT}`)).rejects.toThrowError('Missing or invalid bearer token');
        expect(async () => await decodeBearerToken(`Bearer${validJWT}`)).rejects.toThrowError('Missing or invalid bearer token');
        done();
    });

    it('should throw error on valid bearer token but invalid JWT(format of HTTP Auth header is valid, JWT is wrong)', async(done) => {
        expect(async () => await decodeBearerToken(createBearerTokenHeader(invalidJWT))).rejects.toThrowError('Cannot decode JWT token:');
        done();
    });
});
