import { zodValidateObject } from ".";
import { IdSchema } from "./sharedValidations";

export const GetPricedOffersSchema = IdSchema("offerId").array().nonempty();

export const getPricedOffersValidation = (offerIds: string[]) => {
  return zodValidateObject(offerIds, GetPricedOffersSchema);
};
