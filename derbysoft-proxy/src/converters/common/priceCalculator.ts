import { RoomCriteria, RoomRate } from "@simardwt/derbysoft-types";
import { FareItem, Price, TaxItem } from "@windingtree/glider-types/dist/accommodations";
import Big from "big.js";
import { getDecimals } from "../../utils/currencyConverter";
import { processTaxesAndCharges } from "./taxProcessor";
import { FareItemType } from "@simardwt/winding-tree-types";

export type PriceAndTaxes = {
  price: Price;
  taxItems: TaxItem[]; // Used only in pricing.
  fareItems: FareItem[]; // Used only in pricing.
  totalAmountBeforeTax: string; // Used in shopping Metadata.
  totalAmountAfterTax: string; // Used in shopping Metadata.
  numberOfNights: number;
};

export const computePriceAndTaxes = (
  roomRate: RoomRate,
  roomCriteria: RoomCriteria
): PriceAndTaxes => {
  const currencyCode = roomRate.currency;
  const currencyDecimals = getDecimals(currencyCode);
  const nbOfRooms = roomCriteria.roomCount;
  const nbOfPersons = roomCriteria.adultCount;
  let [nbOfNights, totalAmountBeforeTax, totalAmountAfterTax] = [0, new Big(0), new Big(0)];
  const fareItemsFromAmountBeforeTax: FareItem[] = [];
  const fareItemsFromAmountAfterTax: FareItem[] = [];

  if (roomRate.amountBeforeTax && roomRate.amountBeforeTax.length > 0) {
    nbOfNights = roomRate.amountBeforeTax.length;

    const amountBeforeTax = roomRate.amountBeforeTax.reduce((total, amount) => {
      const bigAmount = new Big(amount);
      fareItemsFromAmountBeforeTax.push({
        amount: bigAmount.mul(nbOfRooms).toFixed(currencyDecimals),
        usage: FareItemType.base,
        description: "Base amount before taxes",
      });
      return total.add(bigAmount.toFixed(currencyDecimals));
    }, new Big(0));

    totalAmountBeforeTax = amountBeforeTax.mul(nbOfRooms);
  }

  if (roomRate.amountAfterTax && roomRate.amountAfterTax.length > 0) {
    nbOfNights = roomRate.amountAfterTax.length;

    const amountAfterTax = roomRate.amountAfterTax.reduce((total, amount) => {
      const bigAmount = new Big(amount);
      fareItemsFromAmountAfterTax.push({
        amount: bigAmount.mul(nbOfRooms).toFixed(currencyDecimals),
        usage: FareItemType.base,
        description: "Base amount after taxes",
      });
      return total.add(bigAmount.toFixed(currencyDecimals));
    }, new Big(0));

    totalAmountAfterTax = amountAfterTax.mul(nbOfRooms);
  }

  if (nbOfNights === 0) {
    // Here it means that there is an issue with both amountBeforeTax and amountAfterTax
    throw new Error("both amountBeforeTax and amountAfterTax are undefined");
  }

  const { totalTaxesDisplay, totalTaxesPayable, taxItems } = processTaxesAndCharges(
    roomRate.fees,
    totalAmountBeforeTax,
    totalAmountAfterTax,
    currencyDecimals,
    nbOfRooms,
    nbOfPersons,
    nbOfNights
  );

  const offerPrice = totalAmountAfterTax.gt(0)
    ? totalAmountAfterTax
    : totalAmountBeforeTax.add(totalTaxesPayable);

  const price: Price = {
    currency: currencyCode,
    public: offerPrice.toFixed(currencyDecimals),
    taxes: totalTaxesDisplay.toFixed(currencyDecimals),
  };

  // fare items with preference for amounts after tax
  const fareItems = fareItemsFromAmountAfterTax.length
    ? fareItemsFromAmountAfterTax
    : fareItemsFromAmountBeforeTax;

  return {
    price,
    fareItems,
    taxItems,
    totalAmountBeforeTax: totalAmountBeforeTax.toFixed(currencyDecimals),
    totalAmountAfterTax: totalAmountAfterTax.toFixed(currencyDecimals),
    numberOfNights: nbOfNights,
  };
};
