import { Column } from "typeorm";

export interface EPhoneConstructorParams {
  countryAccessCode?: string;
  areaCityCode?: string;
  phoneNumber?: string;
}
export class EPhone {
  @Column()
  public countryAccessCode: string;
  @Column()
  public areaCityCode?: string;
  @Column()
  public phoneNumber: string;
  constructor(params: EPhoneConstructorParams) {
    if (params) {
      this.areaCityCode = params.areaCityCode;
      this.countryAccessCode = params.countryAccessCode;
      this.phoneNumber = params.phoneNumber;
    }
  }
}
