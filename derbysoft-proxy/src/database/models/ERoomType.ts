import { Amenity, MediaItem, Occupancy, RoomSize } from "@simardwt/winding-tree-types";
import { Column } from "typeorm";

export class ERoomType {
  @Column(() => Amenity)
  amenities: Amenity[];

  @Column()
  description: string;

  @Column(() => Occupancy)
  maximumOccupancy: Occupancy;

  @Column(() => MediaItem)
  media: MediaItem[];

  @Column()
  name: string;

  @Column()
  policies: Map<string, string>;

  @Column(() => RoomSize)
  size: RoomSize;

  @Column()
  customData?: unknown;
}
