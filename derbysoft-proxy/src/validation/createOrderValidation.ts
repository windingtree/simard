import {
  CreateOfferRequest,
  PassengerBooking,
} from "@windingtree/glider-types/dist/accommodations";
import { object, ZodType, number, enum as zodEnum, string, union, tuple, record } from "zod";
import { zodValidateObject } from ".";
import {
  DateStringSchema,
  IdSchema,
  LoyaltyProgramSchema,
  PassengerTypeSchema,
} from "./sharedValidations";

export const createOrderValidation = (createOfferRequest: CreateOfferRequest) => {
  zodValidateObject(createOfferRequest, CreateOfferRequestSchema);
};

export const CivilitySchema = zodEnum(["MR", "MRS"]);
export const NameSchema = union([
  tuple([string()]),
  tuple([string(), string()]),
  tuple([string(), string(), string()]),
  tuple([string(), string(), string(), string()]),
  tuple([string(), string(), string(), string(), string()]),
]);

export const GenderSchema = zodEnum(["Male", "Female"]);
export const PhoneNumberSchema = string().superRefine((val, ctx) => {
  if (!val) return;
  const regex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (!regex.test(val)) {
    ctx.addIssue({
      message: `Invalid phone number: ${val}`,
      code: "custom",
    });
  }
});

export const ContactInformationSchema = union([PhoneNumberSchema, string().email()]);

export const PassengerBookingSchema = object({
  type: PassengerTypeSchema,
  count: number().optional(),
  civility: CivilitySchema,
  lastnames: NameSchema,
  firstnames: NameSchema,
  middlenames: NameSchema.optional(),
  gender: GenderSchema.optional(),
  birthdate: DateStringSchema.optional(),
  contactInformation: ContactInformationSchema.array().nonempty(),
  loyaltyPrograms: LoyaltyProgramSchema.array().optional(),
}) satisfies ZodType<PassengerBooking>;

export const CreateOfferRequestSchema = object({
  offerId: IdSchema("offerId", "request body"),
  guaranteeId: IdSchema("guaranteeId", "request body"),
  passengers: record(PassengerBookingSchema),
  loyaltyPrograms: LoyaltyProgramSchema.array().optional(),
}) satisfies ZodType<CreateOfferRequest>;
