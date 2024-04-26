import { getLogger } from "@simardwt/winding-tree-utils";
import { IncomingMessage, ServerResponse } from "http";
import morgan, { FormatFn, TokenIndexer } from "morgan";
import { Config, ConfigService } from "../../../services/common/ConfigService";
import { EnhancedRequest, EnhancedResponse } from "../../../types/api/common";

export const loggerMWLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
} as const;

const loggerLevels = Object.keys(loggerMWLevels);
type TloggerMWLevels = typeof loggerLevels[number];

const canLog = (logLevel) => {
  // get log level from ENV
  const env = new ConfigService().getConfig() as Config;
  const envLoglevel = loggerMWLevels[env.log.level] ?? 6;
  return loggerMWLevels[logLevel] && loggerMWLevels[logLevel] >= envLoglevel;
};

export const loggerMW = (logLevel: TloggerMWLevels = "debug") => {
  const env = new ConfigService().getConfig() as Config;
  const log = getLogger(
    __filename,
    {
      topic: "derbysoft-proxy-http",
    },
    // disable grafana in development
    { disableGrafanaLogger: !env.isProduction }
  );
  const logFormatter: FormatFn = (
    tokens: TokenIndexer,
    req: IncomingMessage,
    res: ServerResponse
  ): string => {
    const requestSummary = `${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(
      req,
      res
    )}`;

    let requestBody = "";
    if (tokens.body) {
      requestBody = `\n Request Body: \n ${tokens.body(req, res)}`;
    }

    let responseBody = "";
    if (tokens.resBody) {
      responseBody = `\n Response Body: \n ${tokens.resBody(req, res)}`;
    }

    const messageToLog = requestSummary + requestBody + responseBody;
    return messageToLog;
  };

  // add token for resBody
  morgan.token("resBody", (req: EnhancedRequest, res: EnhancedResponse) => {
    // format JSON only when length of string is less than 1000 characters
    if (res.resBody?.length < 1000) {
      return res.resBody;
    }
    const regex = new RegExp("[\\n\\r\\t]\\s{2,}", "g");
    return (res.resBody as string)?.replace(regex, "").slice(0, 5000);
  });

  morgan.token("body", (req: EnhancedRequest) => JSON.stringify(req.body, null, 2));

  const morganMW = morgan(logFormatter, {
    stream: {
      write: log.info.bind(log),
    },
    skip: () => process.env.NODE_ENV === "test" || !canLog(logLevel),
  });

  return morganMW;
};
