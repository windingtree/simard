import { StayRange } from "@simardwt/derbysoft-types";
import { HotelOTAError } from "../../types";

export const toStayRange = (arrival: string, departure: string): StayRange => {
  // Ideally here we should check the dates by taking into account the timezone of each hotel...
  const [arrivalDate, departureDate] = [new Date(arrival), new Date(departure)];

  if (arrivalDate.toString() === "Invalid Date") {
    throw new HotelOTAError("Invalid arrival date");
  }

  if (departureDate.toString() === "Invalid Date") {
    throw new HotelOTAError("Invalid departure date");
  }

  const stayRange = new StayRange();
  stayRange.checkin = arrivalDate.toISOString().split("T")[0];
  stayRange.checkout = departureDate.toISOString().split("T")[0];

  const todayTs = Date.parse(new Date().toISOString().split("T")[0]);
  const arrivalTs = Date.parse(stayRange.checkin);
  const departureTs = Date.parse(stayRange.checkout);

  if (arrivalTs < todayTs) {
    throw new HotelOTAError("Arrival date is in the past");
  }

  if (departureTs < arrivalTs) {
    throw new HotelOTAError("Departure date is prior to arrival date");
  }

  return stayRange;
};
