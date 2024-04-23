import {createJWT} from '../../../../src/lib/jwt';
import {TestJWTData} from './testJWTData';
import {decodeJWT} from '../../../../src/lib/jwt';
import {env, testenv} from '../../../../src/env';

describe('createJWT', () => {
    it('should create JWT token', async(done) => {
        const jwt = await createJWT(TestJWTData.issuerORGiD, TestJWTData.audienceORGiD, '1 year', TestJWTData.testPrivateKeyPEM, TestJWTData.keyID);
        expect(jwt).not.toBeUndefined();
        done();
    });

    it('should create JWT token that can be successfully decoded', async(done) => {
        const jwt = await createJWT(TestJWTData.issuerORGiD, TestJWTData.audienceORGiD, '1 year', TestJWTData.testPrivateKeyPEM, TestJWTData.keyID);
        expect(jwt).not.toBeUndefined();
        const jwtPayload = decodeJWT(jwt);
        expect(jwtPayload.issuer).toMatch('did:orgid:');
        expect(jwtPayload.issuer).toMatch(`#${TestJWTData.keyID}`);       // suffix with privateKeyIO (e.g. '#webserver') should be also there
        expect(jwtPayload.issuer.substring(10, 76)).toEqual(TestJWTData.issuerORGiD);   // remove 'did:orgid' prefix and check if ORGiD matches

        expect(jwtPayload.audience).toMatch('did:orgid:');
        expect(jwtPayload.audience.substring(10)).toMatch(`${TestJWTData.audienceORGiD}`);       // suffix with privateKeyIO (e.g. '#webserver') should be also there
        done();
    });

    it('should create JWT token to be used with Simard(test)', async(done) => {
        console.log('env.app.aggregatorPrivateKey=', env.app.aggregatorPrivateKey);
        const jwt = await createJWT(env.app.aggregatorOrgId, env.simardPay.orgId, '1 year', env.app.aggregatorPrivateKey, env.app.aggregatorPrivateKeyID);
        expect(jwt).not.toBeUndefined();
        done();
    });

    it('JWT tokens to use with postman tests', async(done) => {
        let jwt = await createJWT(env.app.aggregatorOrgId, env.simardPay.orgId, '1 year', env.app.aggregatorPrivateKey, env.app.aggregatorPrivateKeyID);
        jwt = await createJWT(testenv.gliderOTAOrgId, env.app.aggregatorOrgId, '1 year', testenv.gliderOTAPrivateKey, testenv.gliderOTAPrivateKeyID);
        jwt = await createJWT(testenv.gliderOTAOrgId, env.simardPay.orgId, '1 year', testenv.gliderOTAPrivateKey, testenv.gliderOTAPrivateKeyID);
        jwt = await createJWT(env.app.aggregatorOrgId, env.app.aggregatorOrgId, '1 year', testenv.gliderOTAPrivateKey, testenv.gliderOTAPrivateKeyID);
        done();
    });

    it('JWT tokens to use with postman tests', async(done) => {
        const ORGID_EY_BUSINESS = testenv.eyBusinessOrgID;
        let jwt = await createJWT(ORGID_EY_BUSINESS, env.app.aggregatorOrgId, '1 year', testenv.gliderOTAPrivateKey, testenv.gliderOTAPrivateKeyID);
        jwt = await createJWT(ORGID_EY_BUSINESS, env.simardPay.orgId, '1 year', testenv.gliderOTAPrivateKey, testenv.gliderOTAPrivateKeyID);

        const ORGID_EY_LEISURE = testenv.eyLeiureOrgID;
        jwt = await createJWT(ORGID_EY_LEISURE, env.app.aggregatorOrgId, '1 year', testenv.gliderOTAPrivateKey, testenv.gliderOTAPrivateKeyID);
        jwt = await createJWT(ORGID_EY_LEISURE, env.simardPay.orgId, '1 year', testenv.gliderOTAPrivateKey, testenv.gliderOTAPrivateKeyID);

        const ORGID_GLIDER = testenv.gliderOTAOrgId;
        jwt = await createJWT(ORGID_GLIDER, env.app.aggregatorOrgId, '1 year', testenv.gliderOTAPrivateKey, testenv.gliderOTAPrivateKeyID);
        jwt = await createJWT(ORGID_GLIDER, env.simardPay.orgId, '1 year', testenv.gliderOTAPrivateKey, testenv.gliderOTAPrivateKeyID);
        done();
    });
});
