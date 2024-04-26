import { FeeAmountType, FeeChargeType } from "@simardwt/derbysoft-types";
import { HotelOTAError } from "../../types";

class FeeConverter {
  public chargeTypeToString({ chargeType }: { chargeType: FeeChargeType }): string {
    switch (chargeType) {
      case FeeChargeType.PerPersonPerNight:
        return "per person per night";
      case FeeChargeType.PerPersonPerStay:
        return "per person per stay";
      case FeeChargeType.PerRoomPerNight:
        return "per room per night";
      case FeeChargeType.PerRoomPerStay:
        return "per room per stay";
      default:
        throw new HotelOTAError("Invalid fee charge type");
    }
  }

  public amountTypeToString(
    {
      amountType,
      amount,
    }: {
      amountType: FeeAmountType;
      amount: number;
    },
    currency: string
  ): string {
    if (amountType === FeeAmountType.Fix) {
      return `${amount} ${currency}`;
    } else if (amountType === FeeAmountType.Percent) {
      return `${amount}%`;
    } else {
      throw new HotelOTAError(`Invalid amount type ${amountType}`);
    }
  }
}

const feeConverter = new FeeConverter();

export { feeConverter };
