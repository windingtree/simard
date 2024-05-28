# JSON Web Tokens

## Abstract

JSON Web Tokens (JWT) are defined in [RFC 7519](https://tools.ietf.org/html/rfc7519) and are used in popular web service authentication mechanisms.

JWTs are using a specific set of signatures and algorithms, which include the ECDSA algorithms that are also in use by Ethereum.

However the signature mechanisms in use by the Ethereum ecosystem are different, as the signing of random data is strongly discouraged. Ethereum signatures are adding prefixes in the signed data since [EIP 191](https://eips.ethereum.org/EIPS/eip-191).

For this reason, the JWT token standard is extended to be compatible with Ethereum and Winding Tree ORG.ID directory structure.


## JWT Fields

### Header
The JWT Header _MUST_ contain the following fields:

| Field | Value
|-------|------
| `typ` | JWT
| `alg` | ETH

Example:
```json
{
    "typ": "JWT",
    "alg": "ETH",
}
```

### Payload
The JWT payload _MUST_ contain the following fields:
| Field | Value
|-------|------
| `iss` | The ORG.ID address that authenticated with this JWT token.
| `aud` | The ORG.ID address(es) that is(are) recipient(s) for this JWT token
| `exp` | _As per RFC 7519: JSON Web Token (JWT)_
| `scope` | _As per RFC 8693: OAuth 2.0 Token Exchange_

The JWT payload _MIGHT_ contain any other [standard JWT fields](https://www.iana.org/assignments/jwt/jwt.xhtml) which should be validated accordingly (for example `nbf`).

Example:
```json
{
    "exp": 1579691962,
    "iss": "0x0000000000000000000000000000000000000001",
    "aud": "0x0000000000000000000000000000000000000002",
    "scope": "simard:account:write"
}
```

Notes:
* The signing address can be inferred from the Ethereum signature
* A token validator should validate that the signatory address is allowed for this ORG.ID
* The `scope` values should be defined by the receiving organizations in a way that avoids colisions for the same organization.

### Signature
The signature value of the JWT token, _signed_data_ should be generated as per the EIP-191 requirements, using the version 0x45 'E' which adds the prefix "\x19Ethereum Signed Message:\n", and using the base64 encoded value of _header_._payload_
