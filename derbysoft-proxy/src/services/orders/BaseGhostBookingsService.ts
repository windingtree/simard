import Container, { Service } from "typedi";
import { GhostBookingsStorageService } from "./GhostBookingsStorageService";
import { getLogger } from "@simardwt/winding-tree-utils";
import { OrderStatus } from "@windingtree/glider-types/dist/accommodations";
import { EGhostBooking } from "../../database/models/EGhostBooking";

@Service()
export abstract class BaseGhostBookingsService<PricingMetadata> {
  constructor(protected supplierId: string, protected maxRetries = 0) {
    //
  }

  protected log = getLogger(__filename);

  protected get ghostBookingsStorageService(): GhostBookingsStorageService<PricingMetadata> {
    return Container.get(GhostBookingsStorageService<PricingMetadata>);
  }

  // add a ghost booking to the log
  public abstract addGhostBooking(
    orderId: string,
    pricingMetadata: PricingMetadata,
    errorMessage: string,
    supplierId: string,
    contactEmail: string
  );

  // remove a ghost booking from the log
  public abstract removeGhostBooking(orderId: string, supplierId: string);

  // resolve all pending ghost bookings from provider
  public abstract resolveGhostBookingsFromSuppliers();

  // resolve a ghost booking
  protected abstract resolveGhostBooking(
    ghostBooking: EGhostBooking<PricingMetadata>
  ): Promise<unknown>;

  // check status of booking from provider
  protected abstract getGhostBookingStatusFromProvider(
    orderId: string,
    supplierId: string
  ): Promise<{ status: OrderStatus; orderFromProvider: unknown }>;
}
