curl --request POST \
  -H "Authorization: Bearer $1" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  --data '{"idempotencyKey":"c3d4ee92-a5a5-479b-a590-00000000000","currency":"USD","chain":"ETH"}' \
  --url $2/businessAccount/wallets/addresses/deposit

curl --request GET \
  -H "Authorization: Bearer $1" \
  -H "Accept: application/json" \
  --url $2/businessAccount/wallets/addresses/deposit
