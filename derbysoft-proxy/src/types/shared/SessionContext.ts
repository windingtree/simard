/* eslint-disable @typescript-eslint/no-explicit-any */

import { TSupplierId } from "./Suppliers";

export interface SessionContext {
  clientOrgId: string; // the buyer's orgId
  clientName?: string; // the buyer's optional name
  supplierOrgId: string; // the seller's orgId
  supplierId: TSupplierId; // supplierId in Derbysoft from OrgJSON
  supplierCountryCode?: string; // from OrgJSON
}

export type EnforceSessionContext<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (context: SessionContext, ...args: any[]) => any
    : T[K];
};
