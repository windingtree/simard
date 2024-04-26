import { zodValidateObject } from ".";
import { IdSchema } from "./sharedValidations";

export const cancelOrderValidation = (orderId: string) => {
  return zodValidateObject(orderId, CancelOrderValidationSchema);
};

export const CancelOrderValidationSchema = IdSchema("orderId");
