import "reflect-metadata";
import { bootstrapMicroframework } from "microframework-w3tec";
import { expressLoader, typeormLoader, winstonLoader, iocLoader, jobsLoader } from "./loaders";
import { getLogger } from "@simardwt/winding-tree-utils";
import { HotelOTAError } from "./types";

/**
 * EXPRESS TYPESCRIPT BOILERPLATE
 * ----------------------------------------
 *
 * This is a boilerplate for NDC Proxy application server.
 * It initializes expressJS, logging and database frameworks, swagger and monitoring, IOC
 */

export async function startServer(): Promise<void> {
  const log = getLogger(__filename);
  log.info("Initializing application");
  try {
    await bootstrapMicroframework({
      /**
       * Loader is a place where you can configure all your modules during microframework
       * bootstrap process. All loaders are executed one by one in a sequential order.
       */
      loaders: [winstonLoader, iocLoader, typeormLoader, expressLoader, jobsLoader],
    });
    log.info("Application started");
  } catch (error) {
    if (error instanceof HotelOTAError) {
      const err = error as HotelOTAError;
      log.error(err.message, err.errors);
    } else {
      log.error((error as Error).message);
    }

    process.exit(1);
  }
}
