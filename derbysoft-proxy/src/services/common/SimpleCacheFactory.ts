import { SimpleTimeEvictionBasedCache } from "@simardwt/winding-tree-utils";

export type SimpleCacheType = "string" | "number";
export class SimpleCacheFactory {
  private static serviceInstances:
    | Record<
        SimpleCacheType,
        { cache: SimpleTimeEvictionBasedCache<string, SimpleCacheType>; ttl: number }
      >
    | Record<string, never> = {};
  public static getCacheService(type: SimpleCacheType, ttlInMinutes = 60 * 24) {
    // return singleton instance for similar ttl
    if (this.serviceInstances[type]?.ttl === ttlInMinutes) {
      return this.serviceInstances[type].cache;
    }

    if (type === "string") {
      const stringCacheService = new StringCacheServiceClass(60 * 1000 * ttlInMinutes);
      return stringCacheService;
    }

    // if we are here, then unknown type was requested
    throw new Error(`Invalid SimpleCacheType specified in SimpleCacheFactory - "${type}"`);
  }
}

class StringCacheServiceClass extends SimpleTimeEvictionBasedCache<string, string> {}
