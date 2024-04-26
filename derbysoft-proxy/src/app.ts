/* eslint-disable no-console */
import "dotenv/config";
import "reflect-metadata";

import { getLogger } from "@simardwt/winding-tree-utils";
import { startServer } from "./server";

const log = getLogger(__filename);

startServer()
  .then(() => log.info("Server started"))
  .catch((error) => log.error("Application crashed: " + error));
