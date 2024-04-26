import Container, { Service } from "typedi";
import { BaseGhostBookingsService } from "../orders/BaseGhostBookingsService";
import { DerbysoftPricingMetadata, HotelOTAError } from "../../types";
import { DerbysoftOrdersService } from "./DerbysoftOrdersService";
import { TSupplierId } from "../../types/shared/Suppliers";
import { convertStatus } from "../../converters/common/statusConverter";
import { EGhostBooking } from "../../database/models/EGhostBooking";

@Service()
export class DerbysoftGhostBookingsService extends BaseGhostBookingsService<DerbysoftPricingMetadata> {
  private get derbysoftOrdersService(): DerbysoftOrdersService {
    return Container.get<DerbysoftOrdersService>(DerbysoftOrdersService);
  }

  public async addGhostBooking(
    orderId: string,
    pricingMetadata: DerbysoftPricingMetadata,
    errorMessage: string,
    supplierId: TSupplierId,
    contactEmail: string
  ) {
    await this.ghostBookingsStorageService.createGhostBooking(
      orderId,
      pricingMetadata,
      errorMessage,
      supplierId,
      "DERBYSOFT",
      contactEmail
    );

    this.log.info(
      `created ghost booking due to error for orderId: ${orderId}, errorMessage: ${errorMessage}`
    );
  }

  public async getGhostBookingStatusFromProvider(orderId: string, supplierId: TSupplierId) {
    // get order from supplier
    const orderFromProvider = await this.derbysoftOrdersService.retrieveOrderFromSupplier(
      supplierId,
      { orderId }
    );

    if (!orderFromProvider) {
      throw new HotelOTAError(`error retrieving order from supplier`);
    }

    const status = convertStatus(orderFromProvider);

    return {
      status,
      orderFromProvider,
    };
  }

  public async removeGhostBooking(orderId: string, supplierId: TSupplierId) {
    this.log.info(`remove ghost booking for orderId - ${orderId}`);
    return this.ghostBookingsStorageService.removeGhostBooking(orderId, supplierId);
  }

  public async resolveGhostBookingsFromSuppliers() {
    // get all active ghost bookings
    const ghostBookings = await this.ghostBookingsStorageService.getActiveGhostBookings();

    // for each ghost booking attempt to resolve ghost booking
    const ghostBookingsResolutionPromise = ghostBookings.map((ghostBooking) => {
      return this.resolveGhostBooking(ghostBooking);
    });

    return Promise.allSettled(ghostBookingsResolutionPromise);
  }

  protected async resolveGhostBooking(ghostBooking: EGhostBooking<DerbysoftPricingMetadata>) {
    const { orderId, supplierId, pricingMetadata, contactEmail, retryCount } = ghostBooking;

    // check if max retries exceeded
    if (this.maxRetries && retryCount >= this.maxRetries) {
      return null;
    }

    this.log.info(`Resolving ghost booking for orderId: ${orderId}`);

    try {
      // get order status from supplier
      const { status, orderFromProvider } = await this.getGhostBookingStatusFromProvider(
        orderId,
        supplierId as TSupplierId
      );

      if (status === "CANCELLED") {
        const cancellationId = orderFromProvider?.reservations[0]?.cancellationId;
        await this.derbysoftOrdersService.cancelPendingOrder(orderId, cancellationId);

        // update ghostBooking status
        return this.ghostBookingsStorageService.updateGhostBooking(orderId, supplierId, {
          status: "CANCELLED",
          retryCount: retryCount + 1,
          dateResolved: new Date(),
          lastRetryDate: new Date(),
        });
      } else if (status === "CREATION_FAILED") {
        await this.derbysoftOrdersService.failPendingOrder(orderId);

        // update ghostBooking status
        return this.ghostBookingsStorageService.updateGhostBooking(orderId, supplierId, {
          status: "FAILED",
          retryCount: retryCount + 1,
          dateResolved: new Date(),
          lastRetryDate: new Date(),
        });
      }

      // if status is not 'processing' but settled i.e successful or failed
      else if (status === "CONFIRMED") {
        await this.derbysoftOrdersService.confirmPendingOrder(
          orderId,
          orderFromProvider,
          pricingMetadata,
          contactEmail
        );

        // update ghostBooking status
        return this.ghostBookingsStorageService.updateGhostBooking(orderId, supplierId, {
          status: "CONFIRMED",
          retryCount: retryCount + 1,
          dateResolved: new Date(),
          lastRetryDate: new Date(),
        });
      }

      // if status is 'processing' i.e "IN_PROGRESS"
      else {
        // update ghostBooking status
        return this.ghostBookingsStorageService.updateGhostBooking(orderId, supplierId, {
          retryCount: retryCount + 1,
          lastRetryDate: new Date(),
        });
      }
    } catch (error) {
      this.log.info(
        `Error occurred resolving ghost booking for orderId: ${orderId} - ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }
}
