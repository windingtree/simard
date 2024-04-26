// TO-DO: Delete file - These were helpers for storing Order in DB after spec update.
// All interfaces have been updated and a new entity model "EOrder" defined.

/* import {
  Order as OldOrder,
  OrderStatus as OldOrderStatus,
  Passenger,
  Civility,
  Gender,
  PassengerType,
  ExtendedPriceDetails,
} from "@simardwt/winding-tree-types";
import {
  Order,
  PassengerBooking,
  Price,
  OrderStatus,
} from "@windingtree/glider-types/dist/accommodations";
import { ReservationIds } from "@simardwt/derbysoft-types";
import { HotelOTAError } from "../../types";
import { EOrder } from "../models/EOrder";

export const toOldOrder = (
  order: Order,
  passengers: { [id: string]: PassengerBooking },
  price: Price
): OldOrder => {
  // This function is called when we store the Order in db.
  const oldOrder = new OldOrder();
  oldOrder.status = toOldOrderStatus(order.status);
  oldOrder.passengers = toOldPassengers(passengers);
  oldOrder.price = toOldPrice(price);
  return oldOrder;
};

export const toOrder = (eOrder: EOrder): Order => {
  // TO-DO: Discard: PREVIOUS IMPLEMENTATION for REFERENCE
  const reservationIds = eOrder.providerDetails.orderID as ReservationIds;
  return {
    supplierReservationId: reservationIds.supplierResId,
    status: eOrder.confirmation?.status,
  };
};

export const toOrderStatus = (status: OldOrderStatus): OrderStatus => {
  switch (status) {
    case OldOrderStatus.IN_PROGRESS:
      return "IN_PROGRESS";
    case OldOrderStatus.CONFIRMED:
      return "CONFIRMED";
    case OldOrderStatus.WAITLIST:
      return "WAITLIST";
    case OldOrderStatus.CANCELLED:
      return "CANCELLED";
    case OldOrderStatus.CREATION_FAILED:
      return "CREATION_FAILED";
    default:
      throw new HotelOTAError(`Invalid order status - ${status}`);
  }
};

export const toOldOrderStatus = (status: OrderStatus): OldOrderStatus => {
  switch (status) {
    case "IN_PROGRESS":
      return OldOrderStatus.IN_PROGRESS;
    case "CONFIRMED":
      return OldOrderStatus.CONFIRMED;
    case "WAITLIST":
      return OldOrderStatus.WAITLIST;
    case "CANCELLED":
      return OldOrderStatus.CANCELLED;
    case "CREATION_FAILED":
      return OldOrderStatus.CREATION_FAILED;
    default:
      throw new HotelOTAError(`Invalid order status - ${status}`);
  }
};

export const toOldPassengers = (passengers: { [id: string]: PassengerBooking }): Passenger[] => {
  const passengersMap = new Map(Object.entries(passengers));
  const oldPassengers: Passenger[] = [];
  for (const [id, passenger] of passengersMap) {
    const oldPassenger = toOldPassenger(id, passenger);
    oldPassengers.push(oldPassenger);
  }
  return oldPassengers;
};

export const toOldPassenger = (id: string, passenger: PassengerBooking): Passenger => {
  const oldPassenger = new Passenger();
  oldPassenger.id = String(id);
  if (passenger.birthdate) {
    oldPassenger.birthdate = new Date(passenger.birthdate);
  }
  if (passenger.civility) {
    oldPassenger.civility = Civility[passenger.civility];
  }
  if (passenger.contactInformation) {
    oldPassenger.contactInformation = passenger.contactInformation;
  }
  if (passenger.count) {
    oldPassenger.count = passenger.count;
  }
  oldPassenger.lastnames = passenger.lastnames;
  oldPassenger.firstnames = passenger.firstnames;
  if (passenger.middlenames) {
    oldPassenger.middlenames = passenger.middlenames;
  }
  if (passenger.gender) {
    oldPassenger.gender = Gender[passenger.gender];
  }
  oldPassenger.type = PassengerType[passenger.type];

  return oldPassenger;
};

export const toOldPrice = (price: Price): ExtendedPriceDetails => {
  const oldPrice = new ExtendedPriceDetails();
  if (price.commission) {
    oldPrice.commission = Number(price.commission);
  }
  oldPrice.currency = price.currency;
  oldPrice.public = Number(price.public);
  if (price.taxes) {
    oldPrice.taxes = Number(price.taxes);
  }
  return oldPrice;
}; */
