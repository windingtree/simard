import { Column, Entity, Generated, Index } from "typeorm";
import { IsOptional, IsNotEmpty, IsUUID } from "class-validator";
import { BaseEntity } from "./BaseEntity";
import { EPhone } from "./EPhone";
import { ERoomType } from "./ERoomType";
import { GeoJsonPoint } from "../../types/shared/GeoJsonPoint";
import { EAddress } from "./EAddress";
import { CheckInOutPolicy } from "@simardwt/winding-tree-types";
import { instanceToPlain } from "class-transformer";

export interface EHotelConstructorParams {
  providerId: string;
  providerHotelId: string;
  location: GeoJsonPoint;
  hotelName?: string;
}

@Entity("hotels")
export abstract class EHotel extends BaseEntity {
  @Column({ name: "providerId" })
  @IsNotEmpty()
  public providerId: string;

  // hotelId from provider
  @Column({ name: "providerHotelId" })
  @Index()
  @IsNotEmpty()
  public providerHotelId: string;

  // system generated hotelId
  @Column({ name: "hotelId" })
  @Generated("uuid")
  @IsUUID()
  public hotelId: string;

  @Column({ name: "hotelName" })
  @IsOptional()
  public hotelName: string;

  @Column({ name: "description" })
  @IsOptional()
  public description?: string;

  @Column({ name: "location" })
  @IsNotEmpty()
  public location: GeoJsonPoint;

  @Column({ name: "addresses" })
  @IsOptional()
  public addresses?: EAddress[];

  @Column()
  @IsOptional()
  public phones?: EPhone[];

  @Column({ name: "emails" })
  @IsOptional()
  public emails?: string[];

  @Column()
  @IsOptional()
  public roomTypes?: ERoomType[];

  @Column()
  @IsOptional()
  public policies?: string[];

  @Column()
  @IsOptional()
  public checkInOutPolicy?: CheckInOutPolicy;

  @Column()
  @IsOptional()
  public rating?: number;

  @Column({ name: "customData" })
  @IsOptional()
  protected abstract customData: unknown;

  constructor(params: EHotelConstructorParams) {
    super();
    if (params) {
      const { providerId, providerHotelId, location, hotelName } = params;
      this.providerId = providerId;
      this.providerHotelId = providerHotelId;
      this.location = location;
      this.hotelName = hotelName;
    }
  }

  public toJSON() {
    return instanceToPlain(this);
  }
}
