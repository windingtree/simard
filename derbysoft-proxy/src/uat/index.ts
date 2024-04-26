/* eslint-disable no-console */
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import "dotenv/config";
import { TestType, UatCreditCard, UatHotelData, marriottUatData } from "./uat-data";
import {
  CreateOfferRequest,
  CreateWithOfferResponse,
  Offer,
  OrderCancellationResponse,
  PassengerSearch,
  PricedOfferResponse,
  SearchCriteria,
  SearchResponse,
} from "@windingtree/glider-types/dist/accommodations";
import { DateTime } from "luxon";
import { encodeAccommodationId } from "../utils/accommodation";
import {
  BookingUsbCancelReservationResponse,
  CancelPolicy,
  ShoppingUsbMultiHotelSearchResponse,
} from "@simardwt/derbysoft-types";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { TSupplierId } from "../types/shared/Suppliers";
import { buildPremierInnUatData } from "./premier-inn/build-data";
import { writeFileSync } from "fs";

// Marriot JWT
// eyJhbGciOiJFUzI1NiIsImtpZCI6IkVjZHNhU2VjcDI1NmsxUmVjb3ZlcnlNZXRob2QyMDIwIiwidHlwIjoiSldUIn0.eyJpc3MiOiJkaWQ6b3JnaWQ6NToweDFjMzk0NTgxMDVhYzMyNGQwNmY5NTExMmM1OWU3ZTY1NDI0M2I3ZjM4MDlhOGJiY2Q3YjE0MTRjNDg2ODk2OTIjc2ltYXJkLXRlc3QtZW52IiwiYXVkIjoiZGlkOm9yZ2lkOjU6MHgxYWRjMDZkMzA0N2E4OGJhNWU4NzU3YTg5MjkyNWI1YjQ4YWU0YTkyMDM2YWI4M2Q4ZjE5ZTQ0YmNiNTEyMzJiIn0.MHgxNGEwYzkxZGY2MTkxNDUxNDA1ZmE5NGI1YjY0OTMxMTcyNzFlODcyMWFkNTQwYzY2YzBlYWViZmI4OTdjYTM5MTU5MTRlYTZjZTE0OWQxOTUyOTNjZTI0ODM5MjE2ZGNkN2QxYmYyMTM1YWY0NmE4NWVhYmE5ODYyMWFhYmUwNzFi

type KeyValuePairs = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any;
};

type TestResult = {
  propertyCode?: string;
  roomCode?: string;
  rateCode?: string;
  rateBeforeTax?: number[];
  rateAfterTax?: number[];
  currency?: string;
  cancellationPolicy?: CancelPolicy;
  confirmationNumber?: string;
  cancellationNumber?: string;
  rawResponse?: unknown;
  dateTime: string;
};

type AvailabiltyResult = {
  header: KeyValuePairs;
  offers: Offer[];
  type: Omit<TestType, "booking">;
  rawResponse: unknown;
  dateTime: string;
};

type NoMatchFoundError = {
  error: string;
  offersFound: Offer[];
  type: TestType;
  rawResponse: unknown;
  dateTime: string;
};

type ErrorResult = {
  error: string;
  dateTime: string;
};

type TestResults = {
  [description: string]: TestResult | ErrorResult | AvailabiltyResult | NoMatchFoundError;
};

type TSuppliersData = {
  [supplierId in TSupplierId]?: {
    uatData: UatHotelData[];
    jwt: string;
  };
};

type CardDetails = {
  receiverOrgId: string;
  secureFieldTransactionId: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  billingAddress: {
    countryCode: string;
    stateProv: string;
    postalCode: string;
    cityName: string;
    street: string;
  };
};

// modify this to determine which supplier UAT test to run
const supplierToTest: TSupplierId = "PREMIERINN";

// extract premier inn data
const premierInnUatData = buildPremierInnUatData();

// push to a JSON file
writeFileSync(
  join(__dirname, "premier-inn", "uat-data.json"),
  JSON.stringify(premierInnUatData, null, 2),
  "utf-8"
);

const suppliersData: TSuppliersData = {
  MARRIOTT: {
    uatData: marriottUatData,
    jwt: "eyJhbGciOiJFUzI1NiIsImtpZCI6IkVjZHNhU2VjcDI1NmsxUmVjb3ZlcnlNZXRob2QyMDIwIiwidHlwIjoiSldUIn0.eyJpc3MiOiJkaWQ6b3JnaWQ6NToweDFjMzk0NTgxMDVhYzMyNGQwNmY5NTExMmM1OWU3ZTY1NDI0M2I3ZjM4MDlhOGJiY2Q3YjE0MTRjNDg2ODk2OTIjc2ltYXJkLXRlc3QtZW52IiwiYXVkIjoiZGlkOm9yZ2lkOjU6MHgxYWRjMDZkMzA0N2E4OGJhNWU4NzU3YTg5MjkyNWI1YjQ4YWU0YTkyMDM2YWI4M2Q4ZjE5ZTQ0YmNiNTEyMzJiIn0.MHgxNGEwYzkxZGY2MTkxNDUxNDA1ZmE5NGI1YjY0OTMxMTcyNzFlODcyMWFkNTQwYzY2YzBlYWViZmI4OTdjYTM5MTU5MTRlYTZjZTE0OWQxOTUyOTNjZTI0ODM5MjE2ZGNkN2QxYmYyMTM1YWY0NmE4NWVhYmE5ODYyMWFhYmUwNzFi",
  },
  PREMIERINN: {
    uatData: premierInnUatData,
    jwt: "eyJhbGciOiJFUzI1NiIsImtpZCI6IkVjZHNhU2VjcDI1NmsxUmVjb3ZlcnlNZXRob2QyMDIwIiwidHlwIjoiSldUIn0.eyJpc3MiOiJkaWQ6b3JnaWQ6NToweDFjMzk0NTgxMDVhYzMyNGQwNmY5NTExMmM1OWU3ZTY1NDI0M2I3ZjM4MDlhOGJiY2Q3YjE0MTRjNDg2ODk2OTIjc2ltYXJkLXRlc3QtZW52IiwiYXVkIjoiZGlkOm9yZ2lkOjU6MHgwODAwOGRkYmQzODk3NjUyZDExNjQ0MzRjNzVlOWQwZWUzNTA5N2ExNDQ3NzQ4OTJjYTMzNDVjZWU2OWEwMWJhIn0.MHhkNGY4NTMzMGU3YzAxNjRkNjc0ZTdlOWQxM2FjYmI0ZDljOWRiMTFiMGNiMTQ5ZWRlMmJmNTk3OGY0ZGJmMTQ5MzIyNGQ3MTA3ZWQ0YWNjNDM1ODU1YTRjY2ZiYjMwMjBhOGYwMTY4OGZhY2VlMDUwMjRmMTE3ODJiZGIwMjY4NjFj",
  },
};

const { uatData, jwt } = suppliersData[supplierToTest];

// cache tokenized card transactionId to prevent repeated API calls
const cardCache = {};

const tokenizeCard = async (card: UatCreditCard): Promise<string> => {
  if (cardCache[card.cardNumber]) {
    return cardCache[card.cardNumber];
  }

  const tokenizeBody = {
    mode: "TOKENIZE",
    formId: 211119074243205950,
    cardNumber: card.cardNumber,
    cvv: card.cvv,
    paymentMethod: card.paymentMethod,
    merchantId: 1100031002,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenCard: any;
  try {
    const response = await axios.post(
      "https://pay.sandbox.datatrans.com/upp/payment/SecureFields/paymentField",
      tokenizeBody,
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      }
    );

    tokenCard = response.data;
    if (!tokenCard.transactionId && response.data.error) {
      throw new Error(response.data.error as string);
    }
  } catch (error) {
    console.log(`Error tokenizing card: ${(error as Error).message}`);
    console.log({ tokenizeBody });
    throw new Error(`Error tokenizing card: ${(error as Error).message}`);
  }

  const transactionId = tokenCard.transactionId;

  // cache transactionId
  cardCache[card.cardNumber] = transactionId;
  return transactionId as string;
};

const runTest = async () => {
  const client = axios.create({
    baseURL: `http://localhost:${process.env.APP_PORT}/v1`,
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  try {
    // tokenize card
    const defaultCard: UatCreditCard = {
      cardNumber: "4111111111111111",
      cvv: "737",
      country: "NL",
      paymentMethod: "VIS",
      expiryMonth: "03",
      expiryYear: "2030",
      billingAddress: {
        stateProv: "",
        postalCode: "12345",
        cityName: "Dallas",
        street: "Sunny 12/34",
      },
    };

    const defautCardTransactionId = await tokenizeCard(defaultCard);

    //NDC-Proxy ORGiD (aka Glider Aggregator)
    const GUARANTEE_CREDITOR_ORGID =
      "0x94bf5a57b850a35b4d1d7b59f663ce3a8a76fd9928ef2067cc772fc97fb0ad75";

    const SIMARD_JWT =
      "eyJhbGciOiJFUzI1NksifQ.eyJzY29wZSI6IltdIiwiaWF0IjoxNjU5NTA0MDg3LCJpc3MiOiJkaWQ6b3JnaWQ6MHg5NGJmNWE1N2I4NTBhMzViNGQxZDdiNTlmNjYzY2UzYThhNzZmZDk5MjhlZjIwNjdjYzc3MmZjOTdmYjBhZDc1I3dlYnNlcnZlciIsImF1ZCI6ImRpZDpvcmdpZDoweDU2ZTM0ZmUyODZkZTYyYzRkMTVkNTM2Y2VmMmQxNzFmMGNkMzgwZTM4ZDc3ZDMzZmQ0YTRmMGMxMjU3YjVmOWYiLCJleHAiOjE2NjY3NjE2ODd9.x3QZ6GQ8I0-ESeiBhka9kWH7YKyQlF97UTTfg9j248LvsLeI5m1DqOHnPeYQpz4uuZoW7isSeYx_DsIhYXxflg";

    const testResults: TestResults = {};

    // get hotel ids from test data and collect their coordinates
    // for each uat hotel
    for (let idx = 0; idx < uatData.length; idx++) {
      const testResult: TestResult = {
        dateTime: new Date().toISOString(),
      };
      const currData = uatData[idx];

      // include property code
      testResult.propertyCode = currData.hotelId;
      const hotelId = encodeAccommodationId(
        { hotelId: currData.hotelId, supplierId: currData.supplierId },
        "DS"
      );

      // get cell code when provided
      const cellCode =
        typeof currData.targetRate === "string" &&
        !["max", "random", "mid", "none"].includes(currData.targetRate)
          ? currData.targetRate
          : undefined;

      const isDouble = currData.double ? " , double" : "";
      const isDisabled = currData.disabled ? ", disabled" : "";
      const hasCellCode = cellCode ? `, ${cellCode}` : "";

      const testCaseTitle = `Test case ${currData.title} #${currData.index ?? idx + 1} - ${
        currData.hotelId
      }${hasCellCode}${isDouble}${isDisabled}`;

      console.log({ testCaseTitle });

      // do an offer search using given criteria within coordinate of hotel
      if (currData.loyaltyAccount) {
        currData.loyaltyAccount;
      }

      try {
        const searchCriteria: SearchCriteria = {
          accommodation: {
            arrival: currData.dateOfArrival.toISOString(),
            departure: DateTime.fromJSDate(currData.dateOfArrival)
              .plus({ days: currData.numberOfNights })
              .toISO(),
            hotelIds: [hotelId],
            location: {},
          },
          passengers: [
            {
              count: currData.occupancy.adult,
              type: "ADT",
            },
            ...((currData.occupancy.child
              ? [
                  {
                    count: currData.occupancy.child,
                    type: "CHD",
                    childrenAges: currData.occupancy.childrenAges,
                  },
                ]
              : []) as PassengerSearch[]),
          ],
          loyaltyPrograms: currData.loyaltyAccount
            ? [
                {
                  accountNumber: currData.loyaltyAccount?.accountId,
                  programName: currData.loyaltyAccount?.programCode,
                },
              ]
            : undefined,
        };

        // if offers available, pick specified rate
        let result: SearchResponse;
        try {
          // handle live check vs multi-availability(cache)
          let params: AxiosRequestConfig["params"];
          if (currData.testType === "liveAvailability") {
            params = {
              livecheck: "true",
            };
          }

          const { data } = await client.post<SearchResponse>("/offers/search", searchCriteria, {
            params,
          });

          result = data;
          console.log({ result });
        } catch (err) {
          // catch no offers error
          if (err instanceof AxiosError) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = (err as AxiosError<any, any>).response.data;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const status = (err as AxiosError<any, any>).response.status;
            if ((error as Error).message.includes("No offers available")) {
              (testResults[testCaseTitle] as ErrorResult) = {
                dateTime: new Date().toISOString(),
                error: "No Availabilty - No offers available",
              };
              continue;
            } else if (status !== 500) {
              (testResults[testCaseTitle] as ErrorResult) = {
                dateTime: new Date().toISOString(),
                error: `error: ${(error as Error).message}`,
              };
              continue;
            }
          }
          const errorMessage = `${testCaseTitle} - error: ${
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (err as any).errorMessage ?? (err as any).message
          }`;

          console.log({ errorMessage });
          (testResults[testCaseTitle] as ErrorResult) = {
            dateTime: new Date().toISOString(),
            error: `error: ${
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (err as any).errorMessage ?? (err as any).message
            }`,
          };

          continue;
        }

        const { offers } = result;

        // if liveAvailability or multiAvailability, then we stop here - no booking
        if (currData.testType !== "booking") {
          // store header
          const { header } = result.rawResponse as KeyValuePairs;
          testResults[testCaseTitle] = {
            header,
            offers: Object.values(offers),
            type: currData.testType,
            rawResponse: result.rawResponse,
            dateTime: new Date().toISOString(),
          };

          // go to next item
          continue;
        }

        const offersArray = Object.entries(offers);
        let selectedOfferId: string;

        if (currData.targetRate === "min") {
          for (let idx = 0; idx < offersArray.length; idx++) {
            const [offerId, offer] = offersArray[idx];
            const pricePlansReferences = Object.values(offer.pricePlansReferences)[0];
            if (currData.double) {
              if (pricePlansReferences.roomTypePlan.roomTypeId !== "Double") continue;
            }
            if (currData.disabled) {
              if (pricePlansReferences.roomTypePlan.roomTypeId !== "Accessible") continue;
            }
            if (!selectedOfferId) {
              selectedOfferId = offerId;
              continue;
            }

            const previousOffer = offers[selectedOfferId];
            selectedOfferId =
              previousOffer.price.public < offer.price.public ? selectedOfferId : offerId;
          }
        }

        // handle cell codes
        else if (cellCode) {
          for (let idx = 0; idx < offersArray.length; idx++) {
            const [offerId, offer] = offersArray[idx];

            const pricePlansReferences = Object.values(offer.pricePlansReferences)[0];
            const targetPlan = currData.targetRate.toUpperCase();
            const currentPlan = pricePlansReferences.roomTypePlan?.ratePlanId as string;
            if (currentPlan?.toUpperCase().startsWith(targetPlan)) {
              if (currData.double) {
                if (pricePlansReferences.roomTypePlan.roomTypeId !== "Double") continue;
              }
              if (currData.disabled) {
                if (pricePlansReferences.roomTypePlan.roomTypeId !== "Accessible") continue;
              }
              selectedOfferId = offerId;
              break;
            }
          }
        }
        // no target rate - select first matching offer
        else {
          for (let idx = 0; idx < offersArray.length; idx++) {
            const [offerId, offer] = offersArray[idx];
            const pricePlansReferences = Object.values(offer.pricePlansReferences)[0];

            if (currData.double) {
              if (pricePlansReferences.roomTypePlan.roomTypeId !== "Double") continue;
            }
            if (currData.disabled) {
              if (pricePlansReferences.roomTypePlan.roomTypeId !== "Accessible") continue;
            }
            selectedOfferId = offerId;
            break;
          }
        }

        if (!selectedOfferId) {
          testResults[testCaseTitle] = {
            error: "No Availabilty - No matching rate plan or room type",
            offersFound: Object.values(offers),
            type: currData.testType,
            rawResponse: result.rawResponse,
            dateTime: new Date().toISOString(),
          };

          continue;
        }

        const searchResponse = result.rawResponse as ShoppingUsbMultiHotelSearchResponse;

        // find selected offer - roomRate
        const selectedOffer = offers[selectedOfferId];
        const selectedRoomRate = searchResponse.availHotels?.[0].availRoomRates?.find(
          (roomRate) => {
            return (
              roomRate.rateId ===
                selectedOffer.pricePlansReferences[hotelId].roomTypePlan.ratePlanId &&
              roomRate.roomId ===
                selectedOffer.pricePlansReferences[hotelId].roomTypePlan.roomTypeId
            );
          }
        );

        if (!selectedRoomRate) {
          throw new Error(`${testCaseTitle} - Error selecting roomrate`);
        }

        testResult.cancellationPolicy = selectedRoomRate.cancelPolicy;
        testResult.rateAfterTax = selectedRoomRate.amountAfterTax;
        testResult.rateBeforeTax = selectedRoomRate.amountBeforeTax;
        testResult.currency = selectedRoomRate.currency;
        testResult.rateCode = selectedRoomRate.rateId;
        testResult.roomCode = selectedRoomRate.roomId;

        // get a priced offer
        const { data: pricedOffer } = await client.post<PricedOfferResponse>(
          `/offers/${selectedOfferId}/price`
        );

        console.log({ pricedOffer });

        const pricedOfferId = pricedOffer.offerId;

        // get token guarantee
        let cardDetails: CardDetails;

        if (currData.creditCard) {
          // tokenize card
          const card = currData.creditCard;
          const transactionId = await tokenizeCard(card);

          // stop if card is invalid
          if (!transactionId) {
            console.log(testCaseTitle + " error - Invalid credit card");

            (testResults[testCaseTitle] as ErrorResult) = {
              dateTime: new Date().toISOString(),
              error: "Error: Invalid credit card",
            };
            continue;
          }

          // select first passenger
          const passenger = currData.passengers[0];

          cardDetails = {
            receiverOrgId: GUARANTEE_CREDITOR_ORGID,
            secureFieldTransactionId: transactionId,
            cardholderName: passenger.firstnames.concat(passenger.lastnames).join(" "),
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
            billingAddress: {
              countryCode: card.country,
              stateProv: card.billingAddress?.stateProv ?? defaultCard.billingAddress?.stateProv,
              postalCode: card.billingAddress?.postalCode ?? defaultCard.billingAddress?.postalCode,
              cityName: card.billingAddress?.cityName ?? defaultCard.billingAddress?.cityName,
              street: card.billingAddress?.street ?? defaultCard.billingAddress?.street,
            },
          };
        } else {
          cardDetails = {
            receiverOrgId: GUARANTEE_CREDITOR_ORGID,
            secureFieldTransactionId: defautCardTransactionId,
            cardholderName: "Tomasz Kurek",
            expiryMonth: defaultCard.expiryMonth,
            expiryYear: defaultCard.expiryYear,
            billingAddress: {
              countryCode: defaultCard.country,
              stateProv: defaultCard.billingAddress.stateProv,
              postalCode: defaultCard.billingAddress.postalCode,
              cityName: defaultCard.billingAddress.cityName,
              street: defaultCard.billingAddress.street,
            },
          };
        }

        const simardClient = axios.create({
          baseURL: process.env.SIMARD_URL,
          headers: {
            Authorization: `Bearer ${SIMARD_JWT}`,
          },
        });

        const { data: guaranteeToken } = await simardClient.post(`tokens`, cardDetails);
        const guaranteeId = guaranteeToken.id;

        // complete order
        const createOrderRequest: CreateOfferRequest = {
          offerId: pricedOfferId,
          guaranteeId,
          passengers: currData.passengers.reduce((passengerMap, passenger) => {
            const passengerId = passenger.id;
            delete passenger.id;
            passengerMap[passengerId] = passenger;
            return passengerMap;
          }, {}),
          remarks: currData.specialRequest ? [currData.specialRequest] : undefined,
        };

        const { data: orderDetails } = await client.post<CreateWithOfferResponse>(
          "/orders/createWithOffer",
          createOrderRequest
        );
        console.log({ orderDetails });

        // add confirmation number to result
        testResult.confirmationNumber = orderDetails.order.supplierReservationId;

        // attach raw response
        testResult.rawResponse = orderDetails.rawResponse;

        // check if explicitly prevented from cancelling order
        if (!currData.doNotCancelAfter) {
          // cancel order
          const { data: cancelledOrder } = await client.delete<OrderCancellationResponse>(
            `/orders/${orderDetails.orderId}`
          );
          console.log({ cancelledOrder });

          // add cancellation number to result
          const cancelResponse = cancelledOrder.rawResponse as BookingUsbCancelReservationResponse;
          testResult.cancellationNumber = cancelResponse.cancellationId;
          testResult.rawResponse = cancelledOrder.rawResponse;
        }

        testResults[testCaseTitle] = testResult;
      } catch (error) {
        let err = error;
        if (error instanceof AxiosError) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          err = (err as AxiosError<any, any>).response.data;
        }

        (testResults[testCaseTitle] as ErrorResult) = {
          dateTime: new Date().toISOString(),
          error: `error: ${
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (err as any).errorMessage ?? (err as any).message
          }`,
        };

        continue;
      }
    }

    // log test results
    await mkdir(join(__dirname, "logs"), { recursive: true });
    await writeFile(
      join(__dirname, "logs", `${Date.now()}.log`),
      JSON.stringify(testResults, null, 2),
      {
        encoding: "utf8",
      }
    );
  } catch (err) {
    if (err instanceof AxiosError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = (err as AxiosError<any, any>).response.data;
      console.log(error.message);
    }
    throw err;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
runTest().catch((err: any) => console.log((err as Error).message));
