import {
  getLogger,
  HttpRequestError,
  isAxiosError,
  AxiosError,
  BaseGliderException,
} from "@simardwt/winding-tree-utils";
import { NextFunction, Request, Response } from "express";
import { HotelOTAError } from "../../../types";
import { ValidationError } from "../../../validation";
import { DerbysoftError } from "../../../utils/derbysoftErrorUtils";

const log = getLogger(__filename);

export interface HttpError {
  status: number;
  message: string;
}

export class CustomError extends Error implements HttpError {
  constructor(public statusCode: number, public message: string, public errors?: string[]) {
    super(message);
    this.status = statusCode;
  }
  public status: number;
}

export const errorHandler = (
  err: HttpError | CustomError | HttpRequestError | BaseGliderException,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const throwInternalServerError = () => {
    res.status(500).json({
      code: "D001",
      message: "Internal server error",
    });

    log.error(err.message);
  };

  if (err instanceof ValidationError) {
    res.status(err.status).json({
      code: "D001",
      message: err.message,
      errors: err.errors,
    });
  } else if (err instanceof HttpRequestError) {
    let status: number;
    let error: unknown;
    // check originalError type is AxiosError
    if (isAxiosError(err.originalError)) {
      status = (err.originalError as AxiosError).response?.status ?? 500;
      error = (err.originalError as AxiosError).response?.data;
    } else {
      status = (err.originalError as HttpError)?.status ?? 500;
      error = (err.originalError as HttpError).message;
    }

    if (status === 500) {
      throwInternalServerError();
    } else {
      res.status(status).json({
        code: "D001",
        message: error,
      });
    }
  } else if (err.constructor.name === "HttpError" || err instanceof BaseGliderException) {
    res.status((err as BaseGliderException).httpCode).json({
      code: (err as BaseGliderException).errorCode,
      message: err.message,
    });
  } else if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      code: "D001",
      message: err.message,
    });
  } else if (err instanceof HotelOTAError) {
    res.status(err.status).json({
      code: "D001",
      message: err.message,
    });
  } else if (err instanceof DerbysoftError) {
    if (err.isSystemError) {
      throwInternalServerError();
    } else {
      res.status(err.status).json({
        code: "D001",
        message: err.message,
      });
    }
  } else if (err.status) {
    res.status(err.status).json({
      code: "D001",
      message: err.message,
    });
  } else {
    throwInternalServerError();
  }
};
