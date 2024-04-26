import cc from "currency-codes";
import { HotelOTAError } from "../types";
// import { roundTo } from "./generalUtils";

// export const convertCurrencyAmount = (
//   amount: number,
//   currencyCode: string,
//   errorOnInvalidCurrency = true,
//   roundDecimals = false
// ): number => {
//   // get number of currency decimals - default to 2
//   const decimals = getDecimals(currencyCode, errorOnInvalidCurrency);

//   // divide amount by decimals
//   let convertedAmount = amount / Math.pow(10, decimals);

//   // round decimals to required length in case we have extra decimals
//   if (roundDecimals) convertedAmount = roundTo(convertedAmount, decimals);

//   return convertedAmount;
// };

export const getDecimals = (currencyCode: string, errorOnInvalidCurrency = true): number => {
  // get number of currency decimals - default to 2
  let decimals = cc.code(currencyCode).digits;
  if (decimals === null) {
    if (errorOnInvalidCurrency)
      throw new HotelOTAError(`Invalid currency or currency not found: ${currencyCode}`);

    // use a default of 2 if undefined
    decimals = 2;
  }

  return decimals;
};
