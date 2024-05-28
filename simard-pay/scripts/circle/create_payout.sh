#curl --request POST \
#  -H "Authorization: Bearer $1" \
#  -H "Accept: application/json" \
#  -H "Content-Type: application/json" \
#  --data '{"idempotencyKey":"6ae62bf2-bd71-49ce-a599-00000000000", "destination":{"type": "wire", "id": "06224c68-83d7-4c93-840e-00000000000"}, "amount": {"amount": "0.56", "currency": "USD"}, "metadata": {"beneficiaryEmail": "username@host"}}' \
#  --url $2/payouts

curl --request POST \
  -H "Authorization: Bearer $1" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  --data '{"idempotencyKey": "4ca72ac7-5217-49bb-bbe6-00000000000", "destination": {"type": "blockchain", "address": "0x0000000000000000000000000000000000099335", "chain": "ETH"}, "amount": {"amount": "10069.51", "currency": "USD"}}' \
  --url $2/businessAccount/transfers

curl -X GET \
  -H "Authorization: Bearer $1" \
  -H "Accept: application/json" \
  --url $2/businessAccount/balances
