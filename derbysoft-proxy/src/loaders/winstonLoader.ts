import { MicroframeworkLoader, MicroframeworkSettings } from "microframework-w3tec";
import { configure, format, transports } from "winston";
import { Config, ConfigService } from "../services/common/ConfigService";

export const winstonLoader: MicroframeworkLoader = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings: MicroframeworkSettings | undefined
) => {
  const env = new ConfigService().getConfig() as Config;
  configure({
    transports: [
      new transports.Console({
        level: env.log.level,
        handleExceptions: true,
        format:
          env.node !== "development"
            ? format.combine(format.json())
            : format.combine(format.colorize(), format.simple()),
      }),
    ],
  });
};
