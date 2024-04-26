import { SMDCardBrand, SMDTokenDetails } from "@simardwt/winding-tree-utils";
import { HotelOTAError } from "../../types";
import { CardPayment } from "@simardwt/derbysoft-types";

export const cardTokenToCardPayment = (cardToken: SMDTokenDetails): CardPayment => {
  const cardPayment = new CardPayment();
  cardPayment.cardCode = convertCardBrandToCardCode(cardToken.brand);
  cardPayment.cardHolderName = cardToken.cardholderName;
  cardPayment.cardNumber = cardToken.aliasAccountNumber;

  // NOTE: ensure expiry year is last 2-digits only
  cardPayment.expireDate = cardToken.expiryMonth + cardToken.expiryYear.slice(-2);

  return cardPayment;
};

export const convertCardBrandToCardCode = (cardBrand: SMDCardBrand): string => {
  switch (cardBrand) {
    case SMDCardBrand.amex:
      return "AX";
    case SMDCardBrand.diners:
      return "DN";
    case SMDCardBrand.discover:
      return "DS";
    case SMDCardBrand.jcb:
      return "JC";
    case SMDCardBrand.maestro:
      return "MA";
    case SMDCardBrand.mastercard:
      return "MC";
    case SMDCardBrand.visa:
      return "VI";
    default:
      throw new HotelOTAError("Invalid card brand provided");
  }
};
