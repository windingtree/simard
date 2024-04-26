import { Router } from "express";
import Container from "typedi";
import { OffersController } from "../controllers/offersController";

const offersRouter = Router();

// inject instance of OffersController service
const offersController = Container.get<OffersController>(OffersController);

offersRouter.post("/search", offersController.offersSearch);
offersRouter.post("/:offerId/price", offersController.offerPrice);

export { offersRouter };
