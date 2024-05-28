#curl --request POST \
#  -H "Authorization: Bearer $1" \
#  -H "Accept: application/json" \
#  -H "Content-Type: application/json" \
#  --data '{"endpoint":"https://simard-git-feat-circle-usdc-transfer.simard.vercel.app/api/v1/balances/circleNotification"}' \
#  --url $2/notifications/subscriptions

curl --request DELETE \
  -H "Authorization: Bearer $1" \
  -H "Accept: application/json" \
  --url $2/notifications/subscriptions/e3a1ffeb-7345-47ee-bb0e-00000000000

curl --request GET \
  -H "Authorization: Bearer $1" \
  -H "Accept: application/json" \
  --url $2/notifications/subscriptions
