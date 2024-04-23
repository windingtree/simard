# Introduction
We are developing an API that simplifies interaction with airlines using NDC protocol. 


NDC:
* versatile but complex
* SOAP webservices, complex structure
* requires domain knowledge and experience to consume it and use it
* Although said to be a standard, each airline has it's own flavor. That means it's almost custom implementation for every ariline

Simard API (aka NDC Proxy):
* very simple, yet serving the purporse
* normalized and simplified data
* REST API
* easy to consume by customers

Simard PAY:
* API to handle various payment methods
* Currently payments with credit cards 
* In the future possible payments with crypto currencies

### Authentication
We are using JWTs to authenticate clients
JWT payload has to contain ORGiD identifier (unique ID of an organization registered in WT API/smartcontract)
JWT signature using private key of an organization


### Payments
Currently we support payment using either customer owned card or corporate card

#### customer owned card
In this flow, client (API user) should tokenize card details (using PCI Proxy) and provide tokenized card details in a call to Simard PAY (payment guarantee creation)

#### corporate card
In this flow, payment guarantee creation step does not require card details. Instead, corporate card is used to pay for services.

Both flows do not deviate from each other a lot.
First case requires one extra call to PCIProxy to tokenize customer owned card.

# ❯ Detailed flows description 

## Shopping flow


* Customer makes a requests to NDC Proxy with a basic information about travel:
  * passengers (types, counts)
  * itinerary (segments, travel dates)
  * Optionally frequent traveller information may be provided (FQTV number, loyalty program)

* In a response, JSON with offers, itineraries, segments and price plans is returned

Offer prices are indicative, may change upon pricing (next step).

Each offer has a unique identifier (UUID)
Price plans, flight segments, itineraries are referenced by UUIDs as well  


![diagram ](https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgU2hvcHBpbmcgCiAgICAKCkN1c3RvbWVyLT5ORENQcm94eTogUE9TVCAvb2ZmZXJzL3NlYXJjaApub3RlIHJpZ2h0IG9mIAAuCDogcm91dGUsIHRyYXZlbCBkYXRlcywgcGFzc2VuZ2VycyBpbmZvACQZb3B0aW9uYWxseSBGUVRWIGRldGFpbHMgY2FuIGJlIHByb3ZpZGVkCgCBEwgtPkFpcmxpbmU6IFNPQVAgQWlyAIFICFJRCgAVBwCBPgwAFRFTAEELAIE7CkxpcwCBUgUAgW0GAIEVGmZmZXJfaWQrAIIWBQCBJggsIGluZGljYXRpdmUgcHJpY2UAghQZaXRpbmVyYXJpZXMsIHNlZ21lbnRzLCBsZWdzLAA1BiBwbGFucwoK&s=default)

### POST /offers/search

#### Request

```json
{
  "itinerary": {
    "segments": [
      {
        "origin": {
          "locationType": "airport",
          "iataCode": "DFW"
        },
        "destination": {
          "locationType": "airport",
          "iataCode": "ORD"
        },
        "departureTime": "2023-06-18T17:14:09.255Z"
      }
    ]
  },
  "passengers": [
    {
      "type": "ADT",
      "count": 1
    }
  ]
}
```

#### Response


```json
{
  "offers": {
    "6e6569d3-3be2-4afc-a1b9-446dd7f0f739": {
      "expiration": "2023-05-08T12:30:53.000Z",
      "price": {
        "currency": "USD",
        "public": 160.26,
        "commission": 0,
        "taxes": 25.04
      },
      "pricePlansReferences": {
        "4ba02d0a-bac3-4c16-b1cb-cacf9941281a": {
          "flights": [
            "b412ac64-05ca-4623-9fc1-4839787cbdd3"
          ]
        }
      },
      "provider": "AA"
    },
    "c8289262-19eb-4f05-a2b2-9381d06f6adb": {
      "expiration": "2023-05-08T12:30:53.000Z",
      "price": {
        "currency": "USD",
        "public": 160.26,
        "commission": 0,
        "taxes": 25.04
      },
      "pricePlansReferences": {
        "4ba02d0a-bac3-4c16-b1cb-cacf9941281a": {
          "flights": [
            "3791fe33-d2eb-42b8-823c-3b2565cb7d3a"
          ]
        }
      },
      "provider": "AA"
    }
  },
  "passengers": {
    "T1": {
      "type": "ADT"
    }
  },
  "itineraries": {
    "segments": {
      "cab905c8-f23d-40d0-9417-2a7fc5ce30e7": {
        "departureTime": "2023-06-18T10:00:00.000Z",
        "origin": {
          "locationType": "airport",
          "iataCode": "DFW"
        },
        "arrivalTime": "2023-06-18T12:24:00.000Z",
        "destination": {
          "locationType": "airport",
          "iataCode": "ORD"
        },
        "operator": {
          "operatorType": "airline",
          "flightNumber": "AA423",
          "iataCode": "AA"
        },
        "equipment": {
          "aircraftCode": "321",
          "name": "Airbus A321"
        }
      },
      "0b99d654-009f-448e-8aed-4c87b296e552": {
        "departureTime": "2023-06-18T12:23:00.000Z",
        "origin": {
          "locationType": "airport",
          "iataCode": "DFW"
        },
        "arrivalTime": "2023-06-18T14:56:00.000Z",
        "destination": {
          "locationType": "airport",
          "iataCode": "ORD"
        },
        "operator": {
          "operatorType": "airline",
          "flightNumber": "AA1210",
          "iataCode": "AA"
        },
        "equipment": {
          "aircraftCode": "738",
          "name": "Boeing 737-800 Passenger"
        }
      }
    },
    "combinations": {
      "b412ac64-05ca-4623-9fc1-4839787cbdd3": [
        "cab905c8-f23d-40d0-9417-2a7fc5ce30e7"
      ],
      "3791fe33-d2eb-42b8-823c-3b2565cb7d3a": [
        "0b99d654-009f-448e-8aed-4c87b296e552"
      ]
    }
  },
  "pricePlans": {
    "4ba02d0a-bac3-4c16-b1cb-cacf9941281a": {
      "amenities": [
        "No change fees (difference in ticket price may apply)",
        "Choose your seat at no charge (fee may apply for preferred or Main Cabin Extra seats)",
        "General boarding",
        "Elite Qualifying  Credits (EQMs, EQSs or EQDs)",
        "This ticket is non-refundable."
      ],
      "checkedBaggages": {
        "quantity": 0
      },
      "name": "Main Cabin",
      "penalties": {
        "isChangeableWithFee": false,
        "isRefundable": false,
        "isCancelableWithFee": false
      }
    }
  }
}
```

## Seatmap

Client may retrieve a seatmap for a specific offer (identified by `offer_id`)
In a response, client gets a JSON with seatmap, each seat price and it's characteristics (e.g. window, extra legroom, etc)
There's also a seat description provided and seat prices

![diagram ](https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgU2VhdG1hcApDdXN0b21lci0-TkRDUHJveHk6IFBPU1QgL29mZmVycy86AAMFX2lkL3MALAcAIQgtPkFpcmxpbmU6IFNPQVAATgVBdmFpbGFiaWxpdHlSUQoAGgcAUQwAFRZTAEsLAIELCDoAgSAFIG1hcCB3aXRoIHNlYXQgcHJpY2VzCgo&s=default)

### GET /offers/:offer_id/seatmap


#### Response


```json
{
  "seatmaps": {
    "cab905c8-f23d-40d0-9417-2a7fc5ce30e7": {
      "cabins": [
        {
          "firstRow": 8,
          "lastRow": 36,
          "layout": "ABCDEF",
          "aisleColumns": [
            "C",
            "D"
          ],
          "name": "Y",
          "seats": [
            {
              "row": 8,
              "column": "A",
              "number": "8A",
              "characteristics": [
                "K",
                "L"
              ],
              "available": false,
              "optionCode": "6CB2E7CE",
              "seatMetadata": {
                "seatName": "Main Cabin Extra"
              }
            },
            {
              "row": 8,
              "column": "B",
              "number": "8B",
              "characteristics": [
                "K",
                "L"
              ],
              "available": false,
              "optionCode": "6CB2E7CE",
              "seatMetadata": {
                "seatName": "Main Cabin Extra"
              }
            }
          ]
        }
      ],
      "prices": {
        "6CB2E7CE.MainCabin Extra": {
          "currency": "USD",
          "public": 55.26,
          "commission": 0,
          "taxes": 3.86
        }
      },
      "descriptions": {
        "6CB2E7CE": [
          "Extra legroom (up to 6 inches)",
          "Preferred boarding with earlier overhead bin access"
        ]
      }
    }
  }
}
```

## Offer pricing

To get a binding offer price, offer needs to be priced
Client may price an offer by providing a an offerID and optionally passengers and their seat selection

![diagram ](https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgUHJpY2luZwpDdXN0b21lci0-TkRDUHJveHk6IFBPU1QgL29mZmVycy86AAMFX2lkL3ByaWNlCm5vdGUgcmlnaHQgb2YgADcIOiAAKgVJRCArIG9wdGlvbmFsbHkgc2VsZWN0ZWQgc2VhdHMKAFsILT5BaXJsaW5lOiBPZmZlclByaWNlUlEKAA8HAIEADAAVC1MANQsAbgpTAFsIAIErBSAAgQceRmluYWwAHgYgd2l0aCB0YXgvc2VydmljZXMgYnJlYWtkb3duCgo&s=default)



### POST /offers/:offer_id/price

#### Request


```json
[
  {
    "code": "366781BB",
    "passenger": "T1",
    "segment": "cab905c8-f23d-40d0-9417-2a7fc5ce30e7",
    "seatNumber": "13A"
  }
]
```


#### Response


```json
{
    "offerId": "23494e0b-cd75-4ed8-b27e-f420d33f7c7b",
    "offer": {
        "expiration": "2023-05-08T12:40:39.000Z",
        "price": {
            "currency": "USD",
            "public": 222.9,
            "commission": 0,
            "taxes": 29.41
        },
        "pricedItems": [
            {
                "taxes": [
                    {
                        "amount": 14.51,
                        "currency": "USD",
                        "code": "US",
                        "description": "U.S.A Transportation Tax"
                    },
                    {
                        "amount": 4.8,
                        "currency": "USD",
                        "code": "ZP",
                        "description": "United States Flight Segment Tax Domestic"
                    },
                    {
                        "amount": 5.6,
                        "currency": "USD",
                        "code": "AY",
                        "description": "United States Passenger Civil Aviation Security Service Fee"
                    },
                    {
                        "amount": 4.5,
                        "currency": "USD",
                        "code": "XF",
                        "description": "US Passenger Facility Charge"
                    }
                ],
                "fare": [
                    {
                        "usage": "base",
                        "amount": 193.49,
                        "components": [
                            {
                                "name": "ECONOMY",
                                "basisCode": "SVAIZRUX",
                                "designator": "S"
                            }
                        ],
                        "description": "Base amount"
                    }
                ],
                "passengerRefs": [
                    "T1"
                ],
                "segmentRefs": [
                    "cab905c8-f23d-40d0-9417-2a7fc5ce30e7"
                ]
            }
        ],
        "terms": "Carry-on & personal item (access to overhead bin)\nChoose your seat (fee may apply)\nEligible for upgrades on American Flights\nFlight changes allowed (fee may apply)\nGeneral Boarding",
        "disclosures": [],
        "passengers": {
            "T1": {
                "type": "ADT"
            }
        },
        "itinerary": {
            "segments": {
                "cab905c8-f23d-40d0-9417-2a7fc5ce30e7": {
                    "departureTime": "2023-06-18T10:00:00.000Z",
                    "origin": {
                        "locationType": "airport",
                        "iataCode": "DFW"
                    },
                    "arrivalTime": "2023-06-18T12:24:00.000Z",
                    "destination": {
                        "locationType": "airport",
                        "iataCode": "ORD"
                    },
                    "operator": {
                        "operatorType": "airline",
                        "flightNumber": "AA423",
                        "iataCode": "AA"
                    },
                    "equipment": {
                        "aircraftCode": "321"
                    }
                }
            }
        },
        "options": []
    }
}
```

## Create a payment guarantee

To be able to pay for a booking, client has to first create a payment guarantee.
There may be few alternate flows for this step, depending on the payment method and the payment provider.
For now, we use a flow where client makes a simple POST request to SimardPAY and in a response it gets a JSON with ``guarantee_id``, which later will be used in a booking creation payload.


There may be however(in the future) more complex steps when it comes to payment using crypto currencies.

![diagram ](https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgQ3JlYXRlIHBheW1lbnQgZ3VhcmFudGVlCgoKQ3VzdG9tZXItPlNpbWFyZFBBWTogUE9TVCAvdG9rZW5zCm5vdGUgcmlnaHQgb2YgACgIOgA8GSB1c2VkIHRvIHBheSBmb3IgdGlja2V0AC8ZQWx0ZXJuYXRlIGZsb3dzIGV4aXN0IGhlcmUgZGVwZW5kaW5nIG9uAIE1CXR5cGUpCgCBJQktPgCBCgkAgU8RX2lkCgoK&s=default)


## Order create
Once payment guarantee is created and offer is priced, client may create a booking by providing a guarantee_id, offer_id, detailed passenger information
If FQTV details were provided, it will be also used to create a booking (so that FQTV can benefit from miles/bonus points)

To reduce risk, we do not store PCI data such as credit card number/cvv. Instead of that we use PCIProxy product (3rd party) which allows us to store only a token, which is later used to charge a credit card.

PCIProxy replaces token (in a request payload, e.g. REST or SOAP) with a real credit card number and cvv and forwards it to an airline. 
Once booking is created and payment is processed, PCIProxy returns a response to us.

![diagram ](https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgQ3JlYXRlIGFuIG9yZGVyCgpDdXN0b21lci0-TkRDUHJveHk6IFBPU1QgLwAcBXMvYwAtBVdpdGhPZmZlcgpub3RlIHJpZ2h0IG9mIAA3CDogcHJpY2VkIG9mZmVySUQgKyBndWFyYW50ZWVfaWQgKyBwYXNzZW5nZXIgZGV0YWlscwoAaQgtPlNpbWFyZFBBWTogcmV0cmlldmUgY2FyZAAjCCBmcm9tAEQNCgAqCQCBLQx0b2tlbml6ZWQAMA4AXwtQQ0kAgV4HT3JkZXIAggkGUlEgKAAxCkNDKQoAHwgtPkFpcmxpbmUAHxFkZS0AJQ4AIgcASxhTAEkLAAoYAIIHCgCCTQoAgyIFIGNvbmZpcm1hdGlvbgoK&s=default)


### POST /orders/createWithOffer

#### Request


```json
{
  "offerId": "23494e0b-cd75-4ed8-b27e-f420d33f7c7b",
  "guaranteeId": "a0af57c8-a3e8-4164-9932-6e204c402a63",
  "passengers": {
    "T1": {
      "type": "ADT",
      "civility": "MR",
      "gender": "Male",
      "lastnames": [
        "Doe"
      ],
      "firstnames": [
        "John"
      ],
      "birthdate": "1980-03-21",
      "contactInformation": [
        "+123456789",
        "john.doe@gmail.com"
      ]
    }
  }
}
```


#### Response


```json
{
  "orderId": "537DAF52",
  "order": {
    "price": {
      "currency": "USD",
      "public": 270.9,
      "commission": 0,
      "taxes": 32.76
    },
    "passengers": [
      {
        "type": "ADT",
        "firstnames": [
          "JOHN"
        ],
        "lastnames": [
          "DOE"
        ],
        "contactInformation": [
          "JOHN.DOE@GMAIL.COM"
        ]
      }
    ],
    "itinerary": {
      "segments": [
        {
          "departureTime": "2023-07-18T07:59:00.000Z",
          "origin": {
            "locationType": "airport",
            "iataCode": "LAX"
          },
          "arrivalTime": "2023-07-18T12:09:00.000Z",
          "destination": {
            "locationType": "airport",
            "iataCode": "ORD"
          },
          "operator": {
            "operatorType": "airline",
            "flightNumber": "AA2952",
            "iataCode": "AA"
          },
          "equipment": {
            "aircraftCode": "738"
          }
        }
      ]
    },
    "options": [],
    "status": "CONFIRMED",
    "travelDocuments": {
      "etickets": [
        "00123456789123"
      ],
      "bookings": [
        "ABCDEF"
      ]
    }
  }
}
```



### POST /tokens/:guarantee_id/travel-components

This is a post booking request made by NDC Proxy to Simard PAY to attach some metadata to a payment(guarantee_id)
Metadata is a list of flight segments and passenger information

![diagram ](https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgVXBkYXRlIHBheW1lbnQgZ3VhcmFudGVlIHdpdGggcG9zdCBib29raW5nIGRhdGEKCk5EQ1Byb3h5LT5TaW1hcmRQQVk6IFBPU1QgL3Rva2Vucy86ADwJX2lkL3RyYXZlbC1jb21wb25lbnRzCm5vdGUgcmlnaHQgb2YgAEgIOiBTZW5kAG0FAGkIaW5mbyB0byAAYgdheSB0byBhc3NvY2lhdGUgbWV0YWRhdGEAgSQHAIE8BgoAgQ0JLT4AUQpyZXNwb25zZQoK&s=default)



#### Request


```json
[
  {
    "componentType": "air",
    "documentType": "TKT",
    "documentNumber": "00123456789123",
    "recordLocator": "ABCDEF",
    "documentIssuanceDate": "2023-04-20",
    "segments": [
      {
        "arrivalTime": "2023-07-18T12:09:00.000Z",
        "departureTime": "2023-07-18T07:59:00.000Z",
        "destination": "ORD",
        "origin": "LAX",
        "flightNumber": "2952",
        "iataCode": "AA",
        "serviceClass": "Y"
      }
    ],
    "amounts": {
      "total": "270.90",
      "base": "238.14",
      "taxes": []
    },
    "contactEmail": "JOHN.DOE@GMAIL.COM"
  }
]
```


#### Response


```json
```


## Charge transaction fee (optional, flow dependant)
In some specific cases (identified by clientID), after booking is created, we make a call to external card provider (Stripe) to charge customer card (retrieved from SimardPAY for ``guarantee_id``) 

This is to charge client card with transaction fee.
