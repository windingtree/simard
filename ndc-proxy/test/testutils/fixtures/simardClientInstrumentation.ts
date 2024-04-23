// toggle internal properties of SimardClient to simulate different issuer (Glider OTA)
import {env, testenv} from '../../../src/env';
import {SimardClient} from '../../../src/interfaces/simard';

export function configureSimardClientToSimulateItIsGliderOTA(simardClient: SimardClient): void {
    if (!env.isTest) {
        throw new Error('Cannot reconfigure SimardClient in a non-test environment');
    }
    simardClient.issuerOrgId = testenv.gliderOTAOrgId;
    simardClient.issuerPrivateKey = testenv.gliderOTAPrivateKey;
    simardClient.issuerPrivateKeyID = testenv.gliderOTAPrivateKeyID;
}
// restore internal properties of SimardClient to it's original values(captured at the begining of test)
export function restoreSimardClientIssuerDetailsToDefaults(simardClient: SimardClient): void {
    simardClient.issuerOrgId = env.app.aggregatorOrgId;
    simardClient.issuerPrivateKey = env.app.aggregatorPrivateKey;
    simardClient.issuerPrivateKeyID = env.app.aggregatorPrivateKeyID;
}
