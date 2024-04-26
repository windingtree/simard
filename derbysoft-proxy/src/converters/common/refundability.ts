import {
  CancelDeadline,
  CancelPenalty,
  CancelPolicy,
  PenaltyCharge,
  RoomRate,
} from "@simardwt/derbysoft-types";
import { RefundabilityPolicy } from "@windingtree/glider-types/dist/accommodations";
import { getDecimals } from "../../utils/currencyConverter";
import Big from "big.js";
import { DateTime } from "luxon";
import { getLogger } from "@simardwt/winding-tree-utils";

const log = getLogger(__filename);

type RefundabilityPolicyType = RefundabilityPolicy["type"];

export const refundabilityPolicyMap: Record<RefundabilityPolicyType, string> = {
  non_refundable: "Non-Refundable",
  refundable_with_deadline: "Refundable with Deadline",
};

export interface EnhancedRefundabilityPolicy extends RefundabilityPolicy {
  caption: string;
  description?: string;
}

// Most of the time when the penalty is based on night price, it is based on the first night.
export const computeFirstNightPrice = (roomRate: RoomRate, roomCount: number): string => {
  const currencyCode = roomRate.currency;
  const currencyDecimals = getDecimals(currencyCode);

  // I take the assumption that the nightPrice used to compute the penalty is tax free (if we have it...).
  if (roomRate.amountBeforeTax && roomRate.amountBeforeTax.length > 0) {
    return (roomRate.amountBeforeTax[0] * roomCount).toFixed(currencyDecimals);
  }

  if (roomRate.amountAfterTax && roomRate.amountAfterTax.length > 0) {
    return (roomRate.amountAfterTax[0] * roomCount).toFixed(currencyDecimals);
  }

  // This should not happen
  log.warn("computeNightPrice: both amountBeforeTax and amountAfterTax are absent");
  return (0.0).toFixed(currencyDecimals);
};

export const toRefundabilityPolicy = (
  cancelPolicy: CancelPolicy,
  checkInDate: string,
  nightPrice: string,
  fullStayPrice: string,
  currencyCode: string,
  timezone: string
): EnhancedRefundabilityPolicy | undefined => {
  // If there is no cancel policy, we assume it is not refundable.
  if (!cancelPolicy) {
    return { type: "non_refundable", caption: refundabilityPolicyMap.non_refundable };
  }

  if (cancelPolicy.description === "Non Refundable" || cancelPolicy.code === "AD100P_100P") {
    return {
      type: "non_refundable",
      caption: refundabilityPolicyMap.non_refundable,
      description: cancelPolicy.description,
    };
  }

  if (!cancelPolicy.cancelPenalties || cancelPolicy.cancelPenalties.length === 0) {
    return {
      type: "non_refundable",
      caption: refundabilityPolicyMap.non_refundable,
      description: cancelPolicy.description,
    };
  }

  // Note: we don't consider noShow here and we take the first one, if it is 20% 10D before, and 50 2D before, we return only the first one.
  let penalty: CancelPenalty = undefined;
  for (const cancelPenalty of cancelPolicy.cancelPenalties) {
    if (cancelPenalty.noShow === false) {
      penalty = cancelPenalty;
      break;
    }
  }

  if (cancelPolicy.cancelPenalties.length > 2) {
    log.warn(
      `toRefundabilityPolicy: only one penalty supported and ${
        cancelPolicy.cancelPenalties.length - 1
      } received`
    );
  }

  if (!penalty) {
    return {
      type: "non_refundable",
      caption: refundabilityPolicyMap.non_refundable,
      description: cancelPolicy.description,
    };
  }

  if (penalty.cancellable === false) {
    return {
      type: "non_refundable",
      caption: refundabilityPolicyMap.non_refundable,
      description: cancelPolicy.description,
    };
  }

  // Note: the typo "dealine" is on purpose here, we receive it like this
  if (!penalty.cancelDeadline || penalty.cancelDeadline.dealineTime === "any date time") {
    return {
      type: "non_refundable",
      caption: refundabilityPolicyMap.non_refundable,
      description: cancelPolicy.description,
    };
  }

  if (penalty.cancelDeadline.offsetTimeDropType !== "BeforeArrival") {
    // According to derbySoft we should only receive 'BeforeArrival' here, if not there is an issue.
    log.warn(
      `toRefundabilityPolicy: unknown offsetTimeDropType: ${penalty.cancelDeadline.offsetTimeDropType}`
    );
    return {
      type: "non_refundable",
      caption: refundabilityPolicyMap.non_refundable,
      description: cancelPolicy.description,
    };
  }

  const decimals = getDecimals(currencyCode);
  const deadline = toCancelDeadLine(penalty.cancelDeadline, checkInDate, timezone);
  if (!deadline) {
    log.warn(
      `toRefundabilityPolicy: issue with deadline: ${deadline}, checkInDate: ${checkInDate}, timezone: ${timezone}`
    );
    return {
      type: "non_refundable",
      caption: refundabilityPolicyMap.non_refundable,
      description: cancelPolicy.description,
    };
  }

  return {
    type: "refundable_with_deadline",
    deadline,
    penaltyAmount: toPenaltyAmount(penalty.penaltyCharge, nightPrice, fullStayPrice, decimals),
    caption: refundabilityPolicyMap.refundable_with_deadline,
    description: cancelPolicy.description,
  };
};

export const toCancelDeadLine = (
  cancelDeadLine: CancelDeadline,
  checkInDate: string,
  timezone: string
): string => {
  // Note: if there is an issue with checkInDate, luxon returns `null`
  let deadLine: DateTime;

  // the "dealineTime" is the reference from which the dates are computed.
  if (
    cancelDeadLine.dealineTime &&
    (cancelDeadLine.dealineTime.includes("AM") || cancelDeadLine.dealineTime.includes("PM"))
  ) {
    deadLine = DateTime.fromFormat(
      `${checkInDate} ${cancelDeadLine.dealineTime} ${timezone}`,
      "yyyy-MM-dd ha z",
      { setZone: true }
    );
  } else {
    // If dealineTime is not formatted correctly, we use 12AM (default deadline according to derbySoft)
    log.warn(`toCancelDeadLine: unknown dealineTime: ${cancelDeadLine.dealineTime}`);
    deadLine = DateTime.fromFormat(`${checkInDate} 12AM ${timezone}`, "yyyy-MM-dd ha z", {
      setZone: true,
    });
  }

  if (cancelDeadLine.offsetTimeUnit === "D" && cancelDeadLine.offsetTimeValue) {
    deadLine = deadLine.minus({ days: cancelDeadLine.offsetTimeValue });
  } else if (cancelDeadLine.offsetTimeUnit === "H" && cancelDeadLine.offsetTimeValue) {
    deadLine = deadLine.minus({ hours: cancelDeadLine.offsetTimeValue });
  }

  return deadLine.toISO();
};

export const toPenaltyAmount = (
  penaltyCharge: PenaltyCharge,
  nightPrice: string,
  fullStayPrice: string,
  decimals: number
): string => {
  // Note: there is no currency here, we assumed that the amounts are in the currency of the offer.
  if (penaltyCharge.amount) {
    return penaltyCharge.amount.toFixed(decimals);
  }

  // Usually the baseAmount is full stay, we apply a percentage on it, and if it is NightBase, we return it as is.
  if (penaltyCharge.chargeBase === "FullStay") {
    if (!penaltyCharge.percent) {
      log.warn(`toPenaltyAmount: a percentage was expected`);
      return fullStayPrice;
    }

    if (penaltyCharge.percent === 100) {
      return fullStayPrice;
    }

    return new Big(fullStayPrice).mul(penaltyCharge.percent).div(100).toFixed(decimals);
  } else if (penaltyCharge.chargeBase === "NightBase") {
    if (!penaltyCharge.nights) {
      log.warn(`toPenaltyAmount: a number of nights was expected`);
      return nightPrice;
    }

    return new Big(nightPrice).mul(penaltyCharge.nights).toFixed(decimals);
  } else {
    log.warn(`toPenaltyAmount: unknown chargeBase: ${penaltyCharge.chargeBase}`);
    return fullStayPrice;
  }
};
