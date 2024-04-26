import { Column, Entity } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { BaseEntity } from "./BaseEntity";
import { instanceToPlain } from "class-transformer";

export type GhostBookingStatus = "PENDING" | "FAILED" | "CANCELLED" | "CONFIRMED";

export interface EGhostBookingConstructorParams<PricingMetadata> {
  orderId?: string;
  pricingMetadata?: PricingMetadata;
  errorMessage?: string;
  supplierId?: string;
  providerId: string;
  contactEmail?: string;
}

@Entity("ghostBookings")
export class EGhostBooking<PricingMetadata> extends BaseEntity {
  @Column({ name: "orderId" })
  @IsNotEmpty()
  public orderId: string;

  @Column({ name: "supplierId" })
  public supplierId: string;

  @Column({ name: "providerId" })
  public providerId: string;

  // offer price metadata
  @Column({ name: "pricingMetadata" })
  @IsNotEmpty()
  public pricingMetadata: PricingMetadata;

  // system generated hotelId
  @Column({ name: "errorMessage" })
  public errorMessage: string;

  // ghost booking status
  @Column({ name: "status" })
  public status: GhostBookingStatus = "PENDING";

  // contact email
  @Column({ name: "contactEmail" })
  public contactEmail: string;

  @Column({ name: "dateCreated" })
  public dateCreated: Date = new Date();

  @Column({ name: "retryCount" })
  public retryCount = 0;

  @Column({ name: "lastRetryDate" })
  public lastRetryDate: Date = new Date();

  @Column({ name: "dateResolved" })
  public dateResolved?: Date;

  constructor(params: EGhostBookingConstructorParams<PricingMetadata>) {
    super();
    if (params) {
      Object.assign(this, params);
    }
  }

  public toJSON() {
    return instanceToPlain(this);
  }
}
