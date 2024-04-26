export class Suppliers {
  [orgId: string]: {
    supplierId: TSupplierId;
    supplierName: string;
    hotelCodeContext: string;

    // TO-DO: this is a temp field and will be removed after handling on-the-fly JWT creation
    distributionRulesJwt?: string;
  };
}

export const getSupplierIds = (suppliers: Suppliers): string[] => {
  const supplierIds = [];
  Object.keys(suppliers).forEach((orgId) => {
    supplierIds.push(suppliers[orgId].supplierId);
  });

  return supplierIds;
};

export const getSupplierById = (suppliers: Suppliers, supplierId: string) => {
  const [supplierOrgId, supplier] = Object.entries(suppliers).find(([, currentSupplier]) => {
    return currentSupplier.supplierId === supplierId;
  });

  return { ...supplier, supplierOrgId };
};

export type TSupplierId = "GOHOTEL" | "MARRIOTT" | "PREMIERINN";
