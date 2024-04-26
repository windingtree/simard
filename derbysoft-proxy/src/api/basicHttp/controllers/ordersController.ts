import { CreateOfferRequest } from "@windingtree/glider-types/dist/accommodations";
import { NextFunction, Response } from "express";
import { Inject, Service } from "typedi";
import { DerbysoftOrdersService } from "../../../services/derbysoft/DerbysoftOrdersService";
import { HotelOTAError } from "../../../types";
import { EnhancedRequest } from "../../../types/api/common";
import { BaseController } from "./baseController";

@Service()
export class OrdersController extends BaseController {
  @Inject()
  private ordersService: DerbysoftOrdersService;
  public createOrder = async (
    { body: createOrderRequest, sessionContext }: EnhancedRequest,
    res: Response,
    next: NextFunction
  ) => {
    // call offers service with required parameters

    const { offerId, passengers, guaranteeId, remarks } = createOrderRequest as CreateOfferRequest;

    try {
      if (!offerId) {
        throw new HotelOTAError('Invalid request: "offerId" not provided');
      }

      if (!guaranteeId) {
        throw new HotelOTAError('Invalid request: "guaranteeId" not provided');
      }

      if (!passengers) {
        throw new HotelOTAError('Invalid request: "passengers" not provided');
      }

      if (!Object.values(passengers).length) {
        throw new HotelOTAError('Invalid request: "passengers" is empty');
      }

      const result = await this.ordersService.createOrderWithOfferID(
        sessionContext,
        offerId,
        guaranteeId,
        passengers,
        remarks as string[]
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public retrieveOrderByOrderId = async (
    { params: { orderId }, sessionContext }: EnhancedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!orderId) {
        throw new HotelOTAError("Invalid request: 'orderId' not provided'");
      }

      const result = await this.ordersService.retrieveOrderByOrderID(sessionContext, orderId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public retrieveOrderByOfferId = async (
    req: EnhancedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const offerId: string = req.query.offerId as string;
      if (!offerId) {
        throw new HotelOTAError(
          "Invalid request: No search query parameters - 'offerId' not provided'"
        );
      }

      const result = await this.ordersService.retrieveOrderByOfferID(req.sessionContext, offerId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public cancelOrder = async (
    { params: { orderId }, sessionContext }: EnhancedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!orderId) {
        throw new HotelOTAError("Invalid request: 'orderId' not provided'");
      }

      const result = await this.ordersService.cancelOrderByOrderID(sessionContext, orderId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
