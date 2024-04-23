import {decodeJWT} from '../../../../src/lib/jwt';
const validJWT = 'abcdefg.abdcdef';
const invalidJWT = 'aa.bb.cc';

describe('decodeJWT', () => {
    it('should decode JWT token correctly', async(done) => {
        const jwt = await decodeJWT(validJWT);
        expect(jwt).not.toBeUndefined();
        expect(jwt.audience).toEqual('did:orgid:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
        expect(jwt.issuer).toEqual('did:orgid:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa#webserver');
        done();
    });

    it('should throw error on invalid JWT', async(done) => {
        const decode = async () => {
            await decodeJWT(invalidJWT);
        };
        expect(decode).rejects.toThrowError('Cannot decode JWT token:ERR_JWT_MALFORMED');
        done();
    });
});
