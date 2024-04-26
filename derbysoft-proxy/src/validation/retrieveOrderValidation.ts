import { zodValidateObject } from ".";
import { object } from "zod";
import { IdSchema } from "./sharedValidations";

export const retrieveOrderValidation = (params: { offerId?: string; orderId?: string }) => {
  return zodValidateObject(params, RetrieveOrderValidationSchema);
};

export const RetrieveOrderValidationSchema = object({
  offerId: IdSchema("offerId").optional(),
  orderId: IdSchema("orderId").optional(),
}).strict({ message: "Unknown field(s) in 'Retrieve Order' arguments" });
