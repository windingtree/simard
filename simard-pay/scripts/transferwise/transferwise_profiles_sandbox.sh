#/bin/bash
curl -X GET https://api.sandbox.transferwise.tech/v1/profiles \
    -H "Authorization: Bearer $1"
