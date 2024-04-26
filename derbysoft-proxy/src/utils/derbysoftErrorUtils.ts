import { DerbysoftErrorResponse, ErrorCode, ErrorMessage } from "@simardwt/derbysoft-types";
import { IsValidEnumKey } from "./generalUtils";

export const derbysoftSystemErrors: ErrorCode[] = ["System", "Unknown", "NetError", "Timeout"];

export const isDerbysoftErrorResponse = (error: unknown): boolean => {
  return (
    Boolean((error as DerbysoftErrorResponse)?.errorCode) &&
    IsValidEnumKey((error as DerbysoftErrorResponse)?.errorCode, ErrorMessage) &&
    Boolean((error as DerbysoftErrorResponse)?.errorMessage)
  );
};

export class DerbysoftError extends Error {
  public isSystemError = true; // assume all errors are system errors until properly determined
  public isSupplierError = false;

  constructor(
    public message: string,
    public status = 502,
    public errorResponse?: DerbysoftErrorResponse
  ) {
    super(message);
    let displayMessage: string = message;

    // override error message and status here
    if (errorResponse) {
      const derbysoftError = this.buildDerbysoftError(errorResponse);
      displayMessage = derbysoftError.message;
      this.isSupplierError = derbysoftError.isSupplierError;
      this.isSystemError = derbysoftError.isSystemError;

      if (!this.isSystemError) this.status = 400;
    }

    this.message = displayMessage;
  }

  private buildDerbysoftError = (error: DerbysoftErrorResponse) => {
    // strip second square brackets
    const errorMessage = error.errorMessage?.replace(/[[]]/i, "") || "Unknown error";

    // if a supplier error
    if (error.supplierErrorCode && derbysoftSystemErrors.includes(error.errorCode)) {
      return {
        isSystemError: true,
        message: `(${error.supplierErrorCode})-[${error.errorCode}] - ${errorMessage}`,
        isSupplierError: true,
      };
    }

    // if system error only
    else if (derbysoftSystemErrors.includes(error.errorCode)) {
      return {
        isSystemError: true,
        message: `[${error.errorCode}] - ${errorMessage}`,
        isSupplierError: false,
      };
    }

    // else user error
    else {
      return {
        isSystemError: false,
        message: `[${error.errorCode}] - ${errorMessage}`,
        isSupplierError: false,
      };
    }
  };
}
