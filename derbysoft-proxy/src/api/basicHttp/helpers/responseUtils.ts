import { Response } from "express";
import { jsonResponseMW } from "../middleware/jsonResponseMW";
import { Config, ConfigService } from "../../../services/common/ConfigService";

export const jsonResponse = (res: Response, status: number, data: unknown, message?: string) => {
  res.status(status).json({
    data,
    status: "success",
    message,
  });
};

export const stripRawResponseMW = jsonResponseMW((body) => {
  // strip off rawResponse property
  const env = new ConfigService().getConfig() as Config;
  if (env.showRawResponse) {
    return body;
  }

  if (body) {
    delete body.rawResponse;
  }

  return body;
});
