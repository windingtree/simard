import { SearchCriteria } from "@windingtree/glider-types/dist/accommodations";
import { NextFunction, Response } from "express";
import { Inject, Service } from "typedi";
import { DerbysoftOffersService } from "../../../services/derbysoft/DerbysoftOffersService";
import { HotelOTAError } from "../../../types";
import { EnhancedRequest } from "../../../types/api/common";
import { BaseController } from "./baseController";

@Service()
export class OffersController extends BaseController {
  @Inject()
  private offersService: DerbysoftOffersService;
  public offersSearch = async (
    { body, query, sessionContext }: EnhancedRequest,
    res: Response,
    next: NextFunction
  ) => {
    // call offers service with required parameters
    try {
      const {
        accommodation: accommodationRequest,
        passengers: passengersRequest,
        loyaltyPrograms,
      } = body;

      if (!accommodationRequest) {
        throw new HotelOTAError('Invalid request: "accommodation" field not provided');
      }

      if (!passengersRequest) {
        throw new HotelOTAError('Invalid request: "passengers" field not provided');
      }

      const searchCriteria: SearchCriteria = {
        accommodation: accommodationRequest,
        passengers: passengersRequest,
        loyaltyPrograms,
      };

      // query param included for UAT certification only
      const { livecheck } = query;

      const offers = await this.offersService.searchForOffers(
        sessionContext,
        searchCriteria,
        livecheck as string
      );

      res.status(200).json(offers);
    } catch (error) {
      next(error);
    }
  };

  public offerPrice = async (
    { params: { offerId }, sessionContext }: EnhancedRequest,
    res: Response,
    next: NextFunction
  ) => {
    // call offers service with required parameters
    if (!offerId) {
      throw new HotelOTAError("Invalid request. offerId not provided");
    }

    try {
      const pricedOffer = await this.offersService.getPricedOffers(sessionContext, [offerId]);

      res.status(200).json(pricedOffer);
    } catch (error) {
      next(error);
    }
  };
}
