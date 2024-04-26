import { InjectRepository } from "typeorm-typedi-extensions";
import { EGhostBooking } from "../../database/models/EGhostBooking";
import { MongoRepository } from "typeorm";
import { getLogger } from "@simardwt/winding-tree-utils";
import { HotelOTAError } from "../../types";
import { Service } from "typedi";

export type GhostBookingUpdateOptions<PricingMetadata> = Partial<
  Pick<EGhostBooking<PricingMetadata>, "status" | "dateResolved" | "retryCount" | "lastRetryDate">
>;

@Service()
export class GhostBookingsStorageService<PricingMetadata> {
  @InjectRepository(EGhostBooking)
  private ghostBookingsRepository: MongoRepository<EGhostBooking<PricingMetadata>>;
  private log = getLogger(__filename);

  public async createGhostBooking(
    orderId: string,
    pricingMetadata: PricingMetadata,
    errorMessage: string,
    supplierId: string,
    providerId: string,
    contactEmail: string
  ) {
    const ghostBooking = new EGhostBooking<PricingMetadata>({
      orderId,
      pricingMetadata,
      errorMessage,
      contactEmail,
      supplierId,
      providerId,
    });

    return ghostBooking.save();
  }

  public async getGhostBookingByOrderId(
    orderId: string,
    supplierId: string,
    filterCriteria: Partial<EGhostBooking<PricingMetadata>> = {}
  ) {
    return this.ghostBookingsRepository.findOne({
      ...filterCriteria,
      supplierId,
      orderId,
    });
  }

  public async updateGhostBooking(
    orderId: string,
    supplierId: string,
    updateFields: GhostBookingUpdateOptions<PricingMetadata>,
    filterCriteria: Partial<EGhostBooking<PricingMetadata>> = {}
  ) {
    // find ghost booking
    const booking = await this.getGhostBookingByOrderId(orderId, supplierId, filterCriteria);

    if (!booking) {
      this.log.debug(`Invalid orderId: ${orderId} not found in ghost bookings`);
      throw new HotelOTAError(`Invalid orderId: ${orderId} not found in ghost bookings`);
    }

    // update ghost booking
    Object.assign(booking, { ...updateFields });

    this.log.debug(`updateGhostBooking: ${JSON.stringify(updateFields)}`);
    return booking.save();
  }

  public async getActiveGhostBookings(
    filterCriteria: Partial<EGhostBooking<PricingMetadata>> = {}
  ) {
    // fetch all active ghost bookings
    return this.ghostBookingsRepository.find({
      ...filterCriteria,
      status: "PENDING",
    });
  }

  public getAllGhostBookings(filterCriteria: Partial<EGhostBooking<PricingMetadata>> = {}) {
    // fetch all ghost bookings from log
    return this.ghostBookingsRepository.find({
      ...filterCriteria,
    });
  }

  public async removeGhostBooking(
    orderId: string,
    supplierId: string,
    filterCriteria: Partial<EGhostBooking<PricingMetadata>> = {}
  ) {
    // find ghost booking
    const booking = await this.getGhostBookingByOrderId(orderId, supplierId, filterCriteria);

    if (!booking) {
      this.log.debug(`Invalid orderId: ${orderId} not found in ghost bookings`);
      throw new HotelOTAError(`Invalid orderId: ${orderId} not found in ghost bookings`);
    }

    return booking.remove();
  }
}
