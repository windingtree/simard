import {decodeBearerToken, JWTContent} from '../../../../src/lib/jwt';

const validJWTToken = 'abcdefg.abdcdef';

const validBearertoken = `Bearer ${validJWTToken}`;
const invalidBearerTokenSyntax = `Bearer${validJWTToken}`;
const invalidBearerTokenJWT = `Bearer not_valid_JWT_token`;

describe('parseAndValidateBearerToken', () => {
    it('should parse valid bearer string, extract JWT token from it and return JWTContent', async (done) => {
        const actualJWTConent: JWTContent = await decodeBearerToken(validBearertoken);
        expect(actualJWTConent).not.toBeUndefined();
        expect(actualJWTConent.issuer).toEqual('did:orgid:0xf94c83b1da7bc36989b6a4f25e51ce66dd0fcd88bae1e8486495bbc03e767229#webserver');
        done();
    });

    it('should throw error on invalid bearer token(invalid syntax)', async (done) => {
        expect(async () => await decodeBearerToken(invalidBearerTokenSyntax)).rejects.toThrowError();
        done();
    });

    it('should throw error on invalid bearer token(valid syntax but JWT token invalid)', async (done) => {
        expect(async () => await decodeBearerToken(invalidBearerTokenJWT)).rejects.toThrowError();
        done();
    });

});
