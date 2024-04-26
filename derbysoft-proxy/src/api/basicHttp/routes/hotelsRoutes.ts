import { Router } from "express";
import Container from "typedi";
import { HotelsController } from "../controllers/hotelsController";

const hotelsRouter = Router();

// inject instance of OffersController service
const hotelsController = Container.get<HotelsController>(HotelsController);

hotelsRouter.get("/", hotelsController.getAllHotels);
hotelsRouter.post("/search", hotelsController.getAllHotelsByCoordinates);
hotelsRouter.post("/", hotelsController.getHotelsByIds);

export { hotelsRouter };
