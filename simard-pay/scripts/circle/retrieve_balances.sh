curl -X GET \
  -H "Authorization: Bearer $1" \
  -H "Accept: application/json" \
  --url $2/businessAccount/balances

#curl -X GET \
#  -H "Authorization: Bearer $1" \
#  -H "Accept: application/json" \
#  --url $2/businessAccount/transfers
#
#curl -X GET \
#  -H "Authorization: Bearer $1" \
#  -H "Accept: application/json" \
#  --url $2/businessAccount/wallets/addresses/deposit
