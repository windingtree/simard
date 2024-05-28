curl --request POST \
  -H "Authorization: Bearer $1" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  --data '{"idempotencyKey":"6ae62bf2-bd71-49ce-a599-000000000000", "walletId":"${YOUR_WALLET_ID}","beneficiaryName":"John Smith", "accountNumber":"123456789", "routingNumber":"021000021", "billingDetails":{"name":"John Smith", "city":"Boston", "country":"US", "line1":"1 Main Street", "district":"MA", "postalCode":"02201"}, "bankAddress":{"country":"US"}}' \
  --url $2/payouts
