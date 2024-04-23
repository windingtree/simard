export let TestJWTData;

// dummy private/public keys to be used in tests
TestJWTData = {
    testPrivateKeyPEM: `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIOfzs0hSS23FnUYfmiaUIXsJBPfbdTt6YD+ekCPNlspaoAcGBSuBBAAK
oUQDQgAEjUbRCXEUAsReV5qLaLwxBAHnS1jC/B9fkW8GOubrjce4qrvC7uduTPba
2EHTAHEZRFmqE78VI6fHBdy+8m0lsA==
-----END EC PRIVATE KEY-----`,
    testPublicKeyPEM: `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEjUbRCXEUAsReV5qLaLwxBAHnS1jC/B9f
kW8GOubrjce4qrvC7uduTPba2EHTAHEZRFmqE78VI6fHBdy+8m0lsA==
-----END PUBLIC KEY-----`,
    testJWT: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJhdWQiOiJkaWQ6b3JnaWQ6MHhiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiIiwiaXNzIjoiZGlkOm9yZ2lkOjB4YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYSN3ZWJzZXJ2ZXIiLCJpYXQiOjE2MjU1Njk3NzcsImV4cCI6MTY1NzEyNzM3N30.4lIBbir_BGZwm2nmXa8YNFsMeoSRxR8B-LbFEwpfSDyPHy1qWKNiXKtVjgYOwDbyjU0FwkqWlTwjeaAy24s3iA',
    issuerORGiD: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    audienceORGiD: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    keyID: 'webserver',
};
