import { Column, Entity } from "typeorm";
import { IsOptional, IsNotEmpty, IsEnum, IsString, ValidateIf, IsInt } from "class-validator";
import {
  ActiveStatus,
  AriType,
  ChildRateType,
  RateType,
  ReservationExtensions,
  Timezone,
} from "@simardwt/derbysoft-types";

import { EHotel, EHotelConstructorParams } from "./EHotel";
import { Type } from "class-transformer";
import { MediaItem } from "@simardwt/winding-tree-types";
import { getAccommodationIdFromHotelId } from "../../utils/accommodation";

export interface EDerbysoftHotelConstructorParams extends EHotelConstructorParams {
  supplierId: string;
  status: ActiveStatus;
  ariType: AriType;
  timezone: Timezone;
  rateType: RateType;
  maxChildAge?: number;
}

class DerbysoftCustomData {
  @IsNotEmpty()
  public supplierId: string;

  @IsNotEmpty()
  @IsEnum(ActiveStatus)
  public status: ActiveStatus;

  @IsOptional()
  @IsString()
  public chainCode?: string;

  @IsOptional()
  @IsString()
  public brandCode?: string;

  @IsOptional()
  public settings?: ReservationExtensions;

  @IsNotEmpty()
  @IsEnum(AriType)
  public ariType: AriType;

  @IsNotEmpty()
  public timezone: Timezone;

  @IsNotEmpty()
  @IsEnum(RateType)
  public rateType: RateType;

  @IsOptional()
  @IsEnum(ChildRateType)
  public childRateType?: ChildRateType;

  @IsOptional()
  public media?: MediaItem[];

  @ValidateIf((o) => o.childRateType === ChildRateType.ByAge)
  @IsInt()
  public maxChildAge?: number;

  constructor(params: EDerbysoftHotelConstructorParams) {
    if (params) {
      const { supplierId, status, ariType, timezone, rateType, maxChildAge } = params;
      this.supplierId = supplierId;
      this.status = status;
      this.ariType = ariType;
      this.timezone = timezone;
      this.rateType = rateType;
      this.maxChildAge = maxChildAge;
    }
  }
}

@Entity("hotels")
export class EDerbysoftHotel extends EHotel {
  @Column(() => DerbysoftCustomData)
  @IsOptional()
  @Type(() => DerbysoftCustomData)
  public customData: DerbysoftCustomData;

  constructor(params: EDerbysoftHotelConstructorParams) {
    super(params);
    if (params) {
      this.customData = new DerbysoftCustomData(params);
    }
  }

  public toJSON() {
    // encode hotelId( internal) into accommodationId
    // when sending a JSON representation e.g over HTTP
    const jsonObject = super.toJSON();
    jsonObject.providerHotelId = getAccommodationIdFromHotelId(
      this.providerHotelId,
      this.customData.supplierId
    );

    // TO-DO: probably give a better property name than localId
    // jsonObject.localId = this.providerHotelId;

    return jsonObject;
  }
}
