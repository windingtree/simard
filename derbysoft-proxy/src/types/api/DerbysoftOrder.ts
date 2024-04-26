import {
  BookingUsbBookReservationResponse,
  BookingUsbQueryReservationDetailResponse,
  PreBookReservationParams,
} from "@simardwt/derbysoft-types";

export class DerbysoftOrderRequest {
  constructor(public params: PreBookReservationParams, public bookingToken: string) {}
}

export class DerbysoftOrderResponse extends BookingUsbBookReservationResponse {}

export class DerbysoftRetrieveOrderRequest {}

export class DerbysoftRetrieveOrderResponse extends BookingUsbQueryReservationDetailResponse {}
