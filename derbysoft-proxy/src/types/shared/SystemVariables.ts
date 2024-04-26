import { TSupplierId } from "./Suppliers";

// define enum of available system variables here
export enum SystemVariables {
  // when content is pulled for a given supplier, this field is updated to the last date that it was checked/updated
  CONTENT_API_LAST_MODIFY_DATE = "CONTENT_API_LAST_MODIFY_DATE",

  // last date/time a sync job was run
  LAST_SYNCED_DATE = "LAST_SYNCED_DATE",

  // last time a ghost booking resolution was run
  LAST_GHOST_BOOKING_RUN = "LAST_GHOST_BOOKING_RUN",
}

// union type of enum values
export type SystemVariable = keyof typeof SystemVariables;

// variable scope
export type SystemVariableScope = "GLOBAL" | TSupplierId;

// utility to cast enum values to actual data type - to be extended as more system variables are added
// this will throw compile-time errors if attempt is made to use with invalid variables
export type SystemVariableType<T extends SystemVariable> = T extends "CONTENT_API_LAST_MODIFY_DATE"
  ? Date
  : T extends "LAST_SYNCED_DATE"
  ? Date
  : T extends "LAST_GHOST_BOOKING_RUN"
  ? Date
  : never;
