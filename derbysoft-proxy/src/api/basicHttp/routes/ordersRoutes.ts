import { Router } from "express";
import Container from "typedi";
import { OrdersController } from "../controllers/ordersController";

const ordersRouter = Router();

// inject instance of OrdersController service
const ordersController = Container.get<OrdersController>(OrdersController);

ordersRouter.post("/createWithOffer", ordersController.createOrder);
ordersRouter.get("/:orderId", ordersController.retrieveOrderByOrderId);
ordersRouter.delete("/:orderId", ordersController.cancelOrder);
ordersRouter.get("/", ordersController.retrieveOrderByOfferId);

export { ordersRouter };
