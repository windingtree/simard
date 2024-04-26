import {
  AccommodationCriteria,
  SearchCriteria,
  PassengerSearch,
} from "@windingtree/glider-types/dist/accommodations";
import { ZodType, literal, number, object, string } from "zod";
import { zodValidateObject } from ".";
import {
  DateStringSchema,
  LoyaltyProgramSchema,
  PassengerTypeSchema,
  LocationSearchSchema,
} from "./sharedValidations";

export const searchOffersValidation = (searchCriteria: SearchCriteria, liveCheck: string) => {
  return zodValidateObject({ ...searchCriteria, liveCheck }, SearchOffersParams);
};

export const AccommodationCriteriaSchema = object({
  location: LocationSearchSchema,
  arrival: DateStringSchema,
  departure: DateStringSchema,
  roomCount: number().optional(),
  hotelIds: string().array().optional(),
})
  .required({
    location: true,
    arrival: true,
    departure: true,
  })
  .superRefine((val, ctx) => {
    if (!val || !val.arrival || !val.departure || !val.location) {
      ctx.addIssue({
        message: "'location', 'arrival' and 'departure' are required in 'accommodation'",
        code: "custom",
      });

      return;
    }

    const { arrival, departure } = val;
    const [arrivalDate, departureDate] = [Date.parse(arrival), Date.parse(departure)];

    if (isNaN(arrivalDate) || isNaN(departureDate)) return;

    if (arrivalDate < Date.now()) {
      ctx.addIssue({
        message: "Invalid 'arrival' date. 'arrival' can not be in the past",
        code: "custom",
        path: ["arrival"],
      });
    }

    // set arrival date back to midnight, start of day
    const arrivalDateStartOfDay = new Date(arrivalDate).setUTCHours(0, 0, 0, 0);

    // ensure the departure date is the following day
    const millisecondsBetween = departureDate - arrivalDateStartOfDay;

    if (millisecondsBetween < 0) {
      ctx.addIssue({
        message: "Invalid 'departure' date. 'departure' is before 'arrival'",
        code: "custom",
        path: ["departure"],
      });
    } else if (millisecondsBetween < 24 * 60 * 60 * 1000) {
      ctx.addIssue({
        message: "Invalid 'departure' date. 'departure' is same day as 'arrival'",
        code: "custom",
        path: ["departure"],
      });
    }
  }) satisfies ZodType<AccommodationCriteria>;

export const PassengerSearchSchema = object({
  type: PassengerTypeSchema,
  count: number().positive().int(),
  childrenAges: number().array().optional(),
  loyaltyPrograms: LoyaltyProgramSchema.array().optional(),
}).superRefine((val, ctx) => {
  if (!val) return;

  const { type, childrenAges, count } = val;
  if (["CHD", "INF"].includes(type)) {
    if (!childrenAges?.length) {
      ctx.addIssue({
        message: "'childrenAges' array for child and/or infant is empty or not provided",
        code: "custom",
        path: ["childrenAges"],
      });

      return;
    }

    if (childrenAges && childrenAges.length !== count) {
      ctx.addIssue({
        message: " number of ages in 'childrenAges' array must equal the 'count' of children",
        code: "custom",
        path: ["childrenAges"],
      });

      return;
    }
  }
}) satisfies ZodType<PassengerSearch>;

export const SearchCriteriaSchema = object({
  accommodation: AccommodationCriteriaSchema,
  passengers: PassengerSearchSchema.array().nonempty(),
  loyaltyPrograms: LoyaltyProgramSchema.array().optional(),
}) satisfies ZodType<SearchCriteria>;

export const SearchOffersParams = SearchCriteriaSchema.merge(
  object({ liveCheck: literal("true").optional() })
).strict({ message: "Unknown fields in 'Search Offer' arguments" });
