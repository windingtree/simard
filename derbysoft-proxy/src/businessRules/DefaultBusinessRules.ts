import {
  CreateOfferRequest,
  LoyaltyProgram,
  SearchCriteria,
} from "@windingtree/glider-types/dist/accommodations";
import { DerbysoftOrderRequest, DerbysoftSearchRequest, HotelOTAError } from "../types";
import { TSupplierId } from "../types/shared/Suppliers";
import { Guest, LoyaltyAccount } from "@simardwt/derbysoft-types";
import { ContactPerson } from "@simardwt/derbysoft-types/dist/common/ContactPerson";
import {
  RoomTypeFilter,
  passengerAddressToGuestAddress,
} from "../services/derbysoft/DerbysoftUtils";
import { PassengerBooking } from "@windingtree/glider-types/dist/accommodations";

export interface ItemWithLoyaltyAccount {
  loyaltyAccount?: LoyaltyAccount;
}

export interface ItemWithContactPersonAndGuests {
  contactPerson: ContactPerson;
  guests?: Guest[];
}

export class DefaultBusinessRules {
  constructor(protected supplierId?: TSupplierId) {}
  public processSearchRequest(
    originalSearchRequest: SearchCriteria,
    preprocessedSearchRequest: DerbysoftSearchRequest
  ): DerbysoftSearchRequest {
    // by default no processing is done and we return converted search request
    // derived classes will override this if needed
    return preprocessedSearchRequest;
  }

  // used to filter out room types with or without content for certain suppliers
  public roomTypesFilter: RoomTypeFilter[] = [];

  public processLoyaltyPrograms(loyaltyPrograms: LoyaltyProgram[], item: ItemWithLoyaltyAccount) {
    if (loyaltyPrograms?.length) {
      // derbysoft only accepts one loyalty program so we pick first item of array
      const loyaltyProgram = loyaltyPrograms[0];

      // apply fields to processed search request
      const { accountNumber, programName } = loyaltyProgram;
      if (!accountNumber || !programName) {
        throw new HotelOTAError(
          `Invalid loyaltyProgram field: accountNumber or programName not provided`,
          400
        );
      }

      item.loyaltyAccount = {
        programCode: programName,
        accountId: accountNumber,
      };
    }
  }

  public processOrderRequest(
    originalCreateOfferRequest: CreateOfferRequest,
    preprocessedCreateOfferRequest: DerbysoftOrderRequest
  ): DerbysoftOrderRequest {
    // by default no processing is done and we return converted search request
    // derived classes will override this if needed
    return preprocessedCreateOfferRequest;
  }

  public processPassengersAddresses(
    passengers: PassengerBooking[],
    itemWithContactPersonAndGuests: ItemWithContactPersonAndGuests,
    supplierId: TSupplierId
  ) {
    passengers.forEach((passenger, index) => {
      if (!passenger.address) {
        throw new HotelOTAError(`Passenger Address is required by ${supplierId}`);
      }

      // first guest is contact person
      if (index === 0) {
        itemWithContactPersonAndGuests.contactPerson.address = passengerAddressToGuestAddress(
          passenger.address
        );
      }

      itemWithContactPersonAndGuests.guests[index].address = passengerAddressToGuestAddress(
        passenger.address
      );
    });
  }
}
