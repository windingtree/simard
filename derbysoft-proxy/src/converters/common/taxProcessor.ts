import { TaxItem } from "@windingtree/glider-types/dist/accommodations";
import { Fee, FeeAmountType, FeeChargeType, FeeType, FeeWithDate } from "@simardwt/derbysoft-types";
import Big from "big.js";
import { getLogger } from "@simardwt/winding-tree-utils";

const log = getLogger(__filename);

export interface TaxesAndCharges {
  totalTaxesPayable: Big; // The amount we will add to amountBeforeTax.
  totalTaxesDisplay: Big; // The amount we will put in the taxes field.
  taxItems: TaxItem[];
}

export const processTaxesAndCharges = (
  fees: FeeWithDate[],
  totalAmountBeforeTax: Big,
  totalAmountAfterTax: Big,
  currencyDecimals: number,
  nbOfRooms: number,
  nbOfPersons: number,
  nbOfNights: number
): TaxesAndCharges => {
  const taxItems: TaxItem[] = [];
  let totalTaxesPayable = new Big(0);
  let totalTaxesDisplay = new Big(0);

  if (!fees) {
    return { totalTaxesPayable, totalTaxesDisplay, taxItems };
  }

  for (const feeObj of fees) {
    const { displayAmount, payableAmount } = processFee(
      feeObj.fee,
      totalAmountBeforeTax,
      totalAmountAfterTax,
      nbOfRooms,
      nbOfPersons,
      nbOfNights
    );
    if (displayAmount.lte(0)) {
      continue;
    }

    // We round the taxes before to add them
    totalTaxesDisplay = totalTaxesDisplay.add(displayAmount.toFixed(currencyDecimals));

    taxItems.push({
      amount: displayAmount.toFixed(currencyDecimals),
      code: undefined,
      description: feeObj.fee.name,
    });

    if (payableAmount.lte(0)) {
      continue;
    }

    totalTaxesPayable = totalTaxesPayable.add(payableAmount.toFixed(currencyDecimals));
  }

  return { totalTaxesPayable, totalTaxesDisplay, taxItems };
};

export interface FeeOutput {
  displayAmount: Big; // The amount we display in output of pricing.
  payableAmount: Big; // Value will be 0 if the fee is already included in the price.
}

export const processFee = (
  fee: Fee,
  amountBeforeTax: Big,
  amountAfterTax: Big,
  nbOfRooms: number,
  nbOfPersons: number,
  nbOfNights: number
): FeeOutput => {
  if (fee.type !== FeeType.Exclusive && fee.type !== FeeType.Inclusive) {
    return {
      displayAmount: new Big(0),
      payableAmount: new Big(0),
    };
  }

  const feeAmount = computeFeeAmount(
    fee,
    amountBeforeTax,
    amountAfterTax,
    nbOfRooms,
    nbOfPersons,
    nbOfNights
  );

  if (fee.type === FeeType.Exclusive) {
    return {
      displayAmount: feeAmount,
      payableAmount: feeAmount,
    };
  } else {
    return {
      displayAmount: feeAmount,
      payableAmount: new Big(0),
    };
  }
};

export const computeFeeAmount = (
  fee: Fee,
  amountBeforeTax: Big,
  amountAfterTax: Big,
  nbOfRooms: number,
  nbOfPersons: number,
  nbOfNights: number
): Big => {
  switch (fee.amountType) {
    case FeeAmountType.Fix:
      switch (fee.chargeType) {
        case FeeChargeType.PerPersonPerNight:
          return new Big(fee.amount).mul(nbOfPersons).mul(nbOfNights);
        case FeeChargeType.PerPersonPerStay:
          return new Big(fee.amount).mul(nbOfPersons);
        case FeeChargeType.PerRoomPerNight:
          return new Big(fee.amount).mul(nbOfRooms).mul(nbOfNights);
        case FeeChargeType.PerRoomPerStay:
          return new Big(fee.amount).mul(nbOfRooms);
        default:
          log.warn(`computeFeeAmount: unknown chargeType: ${fee.chargeType}`);
          return new Big(fee.amount);
      }

    case FeeAmountType.Percent:
      // If the amount is a percentage, and we have amountBeforeTax, we compute it.
      if (amountBeforeTax.gt(0)) {
        if (fee.type === FeeType.Exclusive) {
          return new Big(amountBeforeTax).mul(fee.amount).div(100);
        } else {
          // Here we need to extract the tax from the amountBeforeTax
          return extractTax(amountBeforeTax, fee.amount);
        }
      }

      // If we don't have amountBeforeTax, we "extract" the fee from the total amount
      // whatever the value of the feeType
      return extractTax(amountAfterTax, fee.amount);

    default:
      log.warn(`computeFeeAmount: unknown amountType: ${fee.amountType}`);
      return new Big(0);
  }
};

export const extractTax = (amountWithTax: Big, taxPercentage: number): Big => {
  // amountWithTax = amountWithoutTax * (1 + fee.amount/100)
  // so amountWithoutTax = amountWithTax / (1 + fee.amount/100)
  // And we then we return amountWithTax - amountWithoutTax

  const amountWithoutTax = new Big(amountWithTax).div(new Big(taxPercentage).div(100).add(1));
  return amountWithTax.minus(amountWithoutTax);
};
