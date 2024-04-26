import { TSupplierId } from "../types/shared/Suppliers";
import { DefaultBusinessRules } from "./DefaultBusinessRules";
import { MarriotBusinessRules } from "./MarriotBusinessRules";
import { PremierInnBusinessRules } from "./PremierInnBusinessRules";

export class BusinessRulesFactory {
  private static businessRules: Record<TSupplierId, DefaultBusinessRules> | Record<string, never> =
    {};
  private static defaultBusinessRules = new DefaultBusinessRules();
  public static getBusinessRules(supplierId: TSupplierId): DefaultBusinessRules {
    if (this.businessRules[supplierId]) {
      return this.businessRules[supplierId];
    }

    switch (supplierId) {
      case "MARRIOTT":
        this.businessRules[supplierId] = new MarriotBusinessRules(supplierId);
        return this.businessRules[supplierId];

      case "PREMIERINN":
        this.businessRules[supplierId] = new PremierInnBusinessRules(supplierId);
        return this.businessRules[supplierId];
      default:
        return this.defaultBusinessRules;
    }
  }
}
