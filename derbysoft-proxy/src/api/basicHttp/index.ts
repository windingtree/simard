/* eslint-disable no-console */
import debug from "debug";
import app from "./app";

const log = debug("log");

export const runHttpServer = () => {
  // start express server
  const port = process.env.APP_PORT || 5050;
  return app.listen(port, () => log(`Http server listening on port ${port}`));
};
