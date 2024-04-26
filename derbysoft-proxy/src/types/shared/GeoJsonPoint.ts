import { Coordinates } from "./Coordinates";

export class GeoJsonPoint {
  constructor(public coordinates: Coordinates) {}
  public readonly type = "Point";
}
