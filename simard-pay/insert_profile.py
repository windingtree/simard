from simard.profile import Profile

p = Profile({
    "orgid": "0x0000000000000000000000000000000000000000000000000000000000009121",
    "cardData": {
        "aliasCC": "7LHXscqwAAEAAAGCztBvy_8GbX_fAPyM",
        "brand": "visa",
        "type": "credit",
        "maskedCard": "444433xxxxxx1111",
        "expiryMonth": "02",
        "expiryYear": "2023",
        "cardholderName": "Simard OU"
    },
    "billingAddress": {
        "countryCode": "EE",
        "stateProv": "Harju maakond",
        "postalCode": "10115",
        "cityName": "Tallinn",
        "street": "Tartu mnt 67/1-13b"
    }
})
p.store()
print(p._id)
