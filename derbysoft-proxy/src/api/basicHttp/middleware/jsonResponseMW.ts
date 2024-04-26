/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, RequestHandler } from "express";
import { EnhancedRequest, EnhancedResponse } from "../../../types/api/common";

export const jsonResponseMW =
  (responseBodyTransformFn: (...args: any[]) => any): RequestHandler =>
  async (req: EnhancedRequest, res: EnhancedResponse, next: NextFunction) => {
    // override JSON response
    const jsonSend = res.json;
    res.json = function (args: Record<string, any> | any) {
      // add extra property for response body to be used by other MW
      res.resBody = JSON.stringify(args, null, 2);
      return jsonSend.call(this, responseBodyTransformFn(args));
    };

    next();
  };
