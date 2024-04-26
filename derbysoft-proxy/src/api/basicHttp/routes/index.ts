import { Router } from "express";
import { Config, ConfigService } from "../../../services/common/ConfigService";
import { HotelOTAError } from "../../../types";
import { stripRawResponseMW } from "../helpers/responseUtils";
import { authMW } from "../middleware/authMW";
import { docsRouter } from "./docsRouter";
import { hotelsRouter } from "./hotelsRoutes";
import { offersRouter } from "./offersRoutes";
import { ordersRouter } from "./ordersRoutes";
import { distributionRulesMW } from "../middleware/distributionRulesMW";

const v1Router = Router();

v1Router.get("/", (req, res) => {
  return res.json({
    status: "success",
    message: "V1 Base Route - Go to '/docs' sub-route to view docs",
  });
});

// swagger docs route
v1Router.use("/docs", docsRouter);

v1Router.use((req, res, next) => {
  // introduce offline mode where we return 404s only
  const env = new ConfigService().getConfig() as Config;
  const offlineMode = env.offlineMode;
  if (offlineMode) {
    throw new HotelOTAError("Service offline: No items available", 404);
  }

  next();
});

// guarding all routes
v1Router.use(authMW);

// distribution rules middleware
v1Router.use(distributionRulesMW);

// intercept response
v1Router.use(stripRawResponseMW);

v1Router.use("/offers", offersRouter);
v1Router.use("/orders", ordersRouter);
v1Router.use("/accommodations", hotelsRouter);

export { v1Router };
