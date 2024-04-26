// TO-DO: All augmented interfaces need to be defined in glider-types
// Afterwards they should be removed from here

export interface PassengerAddress {
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
}

declare module "@windingtree/glider-types/dist/accommodations" {
  export interface RoomTypePlan {
    mealPlan?: string;
    mealPlanCode?: string;
    ratePlanId?: string;
    ratePlan?: string;
    ratePlanDescription?: string;
    roomId: string;
  }

  export interface PassengerBooking {
    address?: PassengerAddress;
  }
}
