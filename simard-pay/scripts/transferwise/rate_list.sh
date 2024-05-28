#/bin/bash
curl -X GET "https://api.sandbox.transferwise.tech/v1/rates?source=EUR&target=USD" \
    -H "Authorization: Bearer $1"
