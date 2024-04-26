import { OrderStatus } from "@windingtree/glider-types/dist/accommodations";
import { DerbysoftRetrieveOrderResponse, HotelOTAError } from "../../types";
import { ReservationResult, ReservationStatus } from "@simardwt/derbysoft-types";

export function convertStatus(orderResponse: DerbysoftRetrieveOrderResponse): OrderStatus {
  const reservation = orderResponse.reservations[0];

  // if reservation cancellation is last operation
  if (reservation.status === ReservationStatus.Cancelled) {
    if (reservation.result === ReservationResult.Failed) {
      return "CONFIRMED";
    } else if (reservation.result === ReservationResult.Processing) {
      return "IN_PROGRESS";
    } else if (reservation.result === ReservationResult.Successful) {
      return "CANCELLED";
    }
  }
  // if reservation confirmation was last operation
  else if (reservation.status === ReservationStatus.Confirmed) {
    if (reservation.result === ReservationResult.Failed) {
      return "CREATION_FAILED";
    } else if (reservation.result === ReservationResult.Processing) {
      return "IN_PROGRESS";
    } else if (reservation.result === ReservationResult.Successful) {
      return "CONFIRMED";
    }
  }
  // if reservation modification was last operation
  else if (reservation.status === ReservationStatus.Modified) {
    if (reservation.result === ReservationResult.Failed) {
      return "CONFIRMED";
    } else if (reservation.result === ReservationResult.Processing) {
      return "IN_PROGRESS";
    } else if (reservation.result === ReservationResult.Successful) {
      return "CONFIRMED";
    }
  }

  throw new HotelOTAError(
    `Invalid reservation status - ${reservation.status}, reservation result -${reservation.result} `
  );
}
