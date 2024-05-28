#/bin/bash
curl -X GET https://api.transferwise.com/v1/profiles \
    -H "Authorization: Bearer $1"
