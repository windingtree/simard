# Hotel Proxy - User Guide

## About

This is a hotel proxy service that provides access to search for hotel inventory and book reservations through

a host of hotels, hotel chains and accommodation providers.

This proxy is primarily accessible via a HTTP REST API and usage is documented below.

## REST API Servers

There are 3 API servers running in 3 different environments namely: STAGING and PRODUCTION.

STAGING is available for testing, PREPRODUCTION for live data tests and PRODUCTION for live production data.

The base URLS for all environments are:

- **STAGING**: <https://staging.hotels.simard.io/v1>
- **PREPRODUCTION**: <https://preproduction.hotels.simard.io/v1>
- **PRODUCTION**: <https://production.hotels.simard.io/v1>

All API endpoints should be run with reference to any of the URLs listed above.

## Authentication

All endpoints except the documentation endpoints (`/docs`) are protected.

To access a protected endpoint you need to provide a signed `JWT` in the `Authorization` header
as a bearer token.

The `JWT`'s `issuer` should be your `ORGiD` (or that of the buyer),
while the `audience` should contain the `ORGiD` of the target supplier (e.g PREMIER INN or MARRIOTT ORGiD).

For example, to search for offers or create bookings with respect to MARRIOTT hotels,  
you will require a signed JWT for MARRIOTT (i.e the audience of the JWT will be MARRIOTT's ORGiD).

You can generate JWTs by logging into the ORGiD validator with your authentication credentials and  
creating a JWT that has your ORGiD (buyer) as issuer and supplier ORGiD as audience.  
For the documentation available in STAGING visit - <https://staging.orgid-validator-v2.simard.io/docs>

## Swagger Docs

The swagger documentation (OPEN API) for the REST API endpoints and their parameters can found below

- [Swagger docs UI - (View)](./swagger)
- [Swagger Docs Source File (YAML) - (Download)](./yaml)

## Payment

All payments are made through the `SimardPay` platform.

You need to be set up on `SimardPay` to complete bookings, particularly to get `guaranteeId` to complete transactions.

## Booking Flow

### New Booking/Reservation

The steps outlined below need to be followed in chronological order to complete a booking

- Search for offers (availability search) - [`POST /offers/search`].
- Confirm the price of a selected offer (pre-booking/priced offer) - [`POST /offers/{selectedOfferID}/price`].
- Obtain a payment guarantee from `SimardPay` (SimardPay API).
- Create booking/reservation (make order) - [`POST /orders/createWithOffer`].

### Cancel Booking

To cancel a booking, send a request to cancel the booking - [`DELETE /orders/{orderID}`]

\* Details about the fields and parameters required are indicated in the Swagger docs.

### Sample Booking in Staging Environment

1.  The steps in the booking flow in `STAGING` environment is outlined below:  
    Authenticate/Login using your `STAGING` credentials to get AccessToken (OrgIDValidator **AccessToken**):  
    <https://staging.orgid-validator-v2.simard.io/auth/login>

    ```
      {
          "login": "your-login-id",
          "password": "your-password",
          "orgId": "did:orgid:5:0x1234567890abcdef", <-- Your ORGiD
      }
    ```

    All subsequent calls to ORGiD validator (creating JWTs) should be authenticated using OrgIDValidator **AccessToken**.

1.  Create **DerbysoftProxy JWT** with `MARRIOTT STAGING ORGiD` as target audience.  
    All subsequent calls to DerbysoftProxy will use this JWT  
    <https://staging.orgid-validator-v2.simard.io/auth/create-jwt>

    ```
      Body: { audienceOrgId":"did:orgid:5:0x1adc06d3047a88ba5e8757a892925b5b48ae4a92036ab83d8f19e44bcb51232b" }
    ```

    Search for offers and price offers through DerbysoftProxy in `STAGING` using **DerbysoftProxy JWT**  
    **DerbysoftProxy URL**: <https://staging.hotels.simard.io/api/v1>

    **Note**: If you want a fully refundable booking, please select an offer with **refundability** of `refundable_with_deadline`

1.  To successfully create an order, you need a payment guarantee from SImardPay `STAGING`  
    To get a guarantee token/id:

    - Get a `transactionId` from PCI Proxy `SANDBOX`
    - Create a **SimardPay JWT** with SimardPay `STAGING` ORGiD as target audience  
      <https://staging.orgid-validator-v2.simard.io/auth/create-jwt>
      ```
          Body: { audienceOrgId":"did:orgid:0x56e34fe286de62c4d15d536cef2d171f0cd380e38d77d33fd4a4f0c1257b5f9f" }
      ```
    - Create guarantee token/id on SimardPay using DerbysoftProxy ORGiD as `receiverOrgId`,  
      `transactionId` from (i) above and authenticate with **SimardPay JWT**:  
      <https://staging.payment.simard.io/api/v1/tokens>
      ```
          receiverOrgId: did:orgid:5:0x8924d2cd6877826842a6685a17dc2c7e81016680caa788ab1acf7aa7868da8b8
      ```

1.  Create order on DerbysoftProxy using `guaranteeId` from (4) above. You will receive an `orderId`, and `supplierReservationId`  
    as part of a success response

1.  You can optionally cancel the order that you just created above by making a `DELETE` call with the `orderId` from (5) above to DerbysoftProxy:  
    <https://staging.hotels.simard.io/api/v1/orders/{{orderId}}>
