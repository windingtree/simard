#/bin/bash
curl -X POST https://api.sandbox.transferwise.tech/v1/quotes \
    -H "Authorization: Bearer $1" \
    -H "Content-Type: application/json" \
     -d '{
          "profile": 16027720,
          "source": "EUR",
          "target": "GBP",
          "rateType": "FIXED",
          "targetAmount": 600,
          "type": "BALANCE_CONVERSION"
        }'
