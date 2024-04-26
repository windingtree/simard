import { LocationSearch } from "@windingtree/glider-types/dist/accommodations";
import { zodValidateObject } from ".";
import { object, string } from "zod";
import { LocationSearchSchema } from "./sharedValidations";

export const getHotelsValidation = (params: {
  accommodationIds?: string[];
  location?: LocationSearch;
}) => {
  return zodValidateObject(params, getHotelsValidationSchema);
};

export const getHotelsValidationSchema = object({
  accommodationIds: string().array().optional(),
  location: LocationSearchSchema.optional(),
}).strict({ message: "Unknown field(s) in 'Get Hotels' arguments" });
