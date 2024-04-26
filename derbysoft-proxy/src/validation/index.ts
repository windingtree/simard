import { ZodError, ZodObject, ZodRawShape, ZodArray, ZodTypeAny, ZodString, ZodNumber } from "zod";

export interface HttpError {
  status: number;
  message: string;
}

export type ValidationErrorField = {
  [errorPath: string]: string[];
};

export class ValidationError extends Error implements HttpError {
  constructor(public errors: ValidationErrorField[]) {
    super("ValidationError: Check 'errors' field for details");
    this.status = 422;
  }

  public status: number;
}

export const processValidationErrors = (error: ZodError): ValidationErrorField[] | undefined => {
  if (error?.isEmpty || !error?.issues.length) {
    return undefined;
  }

  const errors: ValidationErrorField = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(" => ");
    if (errors[path]?.length) {
      errors[path].push(issue.message);
    } else {
      errors[path] = [issue.message];
    }
  });

  // convert errors object to array
  return Object.entries(errors).map(([path, err]) => {
    return { [path]: err };
  });
};

export const zodValidateObject = <T>(
  obj: T,
  validationObject:
    | ZodObject<ZodRawShape>
    | ZodArray<ZodTypeAny, "atleastone" | "many">
    | ZodString
    | ZodNumber
) => {
  const validationResult = validationObject.safeParse(obj);

  if (validationResult.success === true) {
    return validationResult.data as T;
  } else if (validationResult.success === false && validationResult.error) {
    const validationErrors = processValidationErrors(validationResult.error);
    if (!validationErrors) return undefined;

    throw new ValidationError(validationErrors);
  }

  return undefined;
};

// export all validations from here
export * from "./searchOffersValidation";
export * from "./getPricedOffersValidation";
export * from "./getHotelsValidation";
