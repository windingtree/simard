import {
  LocationRectangle,
  LocationSearch,
  LocationCircle,
  LoyaltyProgram,
} from "@windingtree/glider-types/dist/accommodations";
import { ZodIssueCode, ZodType, number, object, string, enum as zodEnum } from "zod";

export const IdSchema = (
  type: "offerId" | "orderId" | "guaranteeId",
  position = "in query params"
) =>
  string().uuid({
    message: `Invalid '${type}'. '${type}' ${position} must be a valid UUID`,
  });

export const DateStringSchema = string().transform((val, ctx) => {
  const dateValue = new Date(val).valueOf();

  if (isNaN(dateValue)) {
    ctx.addIssue({
      message: "Invalid date string - (use format: YYYY-MM-DD)",
      code: "custom",
    });
  }

  return val;
});

export const LongitudeSchema = number().refine(
  (val) => val >= -180 && val <= 180,
  (val) => ({ message: `Longitude (${val}) must be between -180 and 180` })
);

export const LatitudeSchema = number().refine(
  (val) => val >= -90 && val <= 90,
  (val) => ({ message: `Latitude (${val}) must be between -90 and 90` })
);

export const LocationRectangleSchema = object({
  north: LatitudeSchema,
  south: LatitudeSchema,
  east: LongitudeSchema,
  west: LongitudeSchema,
}).superRefine((val, ctx) => {
  if (!val) return undefined;

  const { north, south, west, east } = val;

  if (north < south) {
    ctx.addIssue({
      message: `Latitude: 'north' (${north}) must be greater than south (${south})`,
      code: ZodIssueCode.custom,
    });
  }

  if (east < west) {
    ctx.addIssue({
      message: `Longitude: 'east' (${east}) must be greater than west (${west}) in 'rectangle'`,
      code: ZodIssueCode.custom,
    });
  }
}) satisfies ZodType<LocationRectangle>;

export const LocationCircleSchema = object({
  lat: LatitudeSchema,
  long: LongitudeSchema,
  radius: number().positive(),
}) satisfies ZodType<LocationCircle>;

export const LocationSearchSchema = object({
  rectangle: LocationRectangleSchema.optional(),
  circle: LocationCircleSchema.optional(),
}).superRefine((val, ctx) => {
  if (!val || (!val.circle && !val.rectangle)) {
    ctx.addIssue({
      message: "One of 'circle' or 'rectangle' is required in 'location'",
      code: ZodIssueCode.custom,
    });

    return;
  }

  if (val.circle && val.rectangle) {
    ctx.addIssue({
      message: "Only one of 'circle' or 'rectangle' is required in 'location'",
      code: "custom",
    });

    return;
  }
}) satisfies ZodType<LocationSearch>;

export const LoyaltyProgramSchema = object({
  accountNumber: string(),
  programName: string(),
}) satisfies ZodType<LoyaltyProgram>;

export const PassengerTypeSchema = zodEnum(["ADT", "CHD", "INF"]);
