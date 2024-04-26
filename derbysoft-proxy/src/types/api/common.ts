import { Request, Response } from "express";
import { SessionContext } from "../shared/SessionContext";

export interface EnhancedRequest extends Request {
  sessionContext?: SessionContext;
}

export interface EnhancedResponse extends Response {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resBody?: any;
}
