import { Column } from "typeorm";

export interface EAddressConstructorParams {
  premise?: string;
  postalCode?: string;
  addressLine?: string[];
  city?: string;
  state?: string;
  country?: string;
}

export class EAddress {
  @Column()
  public premise?: string;
  @Column()
  public postalCode?: string;
  @Column()
  public addressLine?: string[];
  @Column()
  public city: string;
  @Column()
  public state?: string;
  @Column()
  public country: string;
  constructor(params: EAddressConstructorParams) {
    if (params) {
      this.premise = params.premise;
      this.postalCode = params.postalCode;
      this.addressLine = params.addressLine;
      this.city = params.city;
      this.state = params.state;
      this.country = params.country;
    }
  }
}
