import "dotenv/config";
import { getOsEnvOptional, toBool, toMultiline, toNumber } from "@simardwt/winding-tree-utils";
import { HotelOTAError } from "../../types/shared/HotelOTAError";
import { Suppliers, getSupplierIds } from "../../types/shared/Suppliers";
import { plainToInstance } from "class-transformer";
import { readFileSync } from "fs";
import { Method } from "axios";

export function getOsEnv(key: string): string {
  if (typeof process.env[key] === "undefined") {
    throw new Error(`Environment variable ${key} is not set.`);
  }

  return process.env[key] as string;
}
export interface Config {
  derbysoft: {
    distributorId: string;
    bookingAccessToken: string;
    bookingBaseURL: string;
    shoppingAccessToken: string;
    shoppingBaseURL: string;
    supplierIds: string[];
    suppliers: Suppliers;
    contentApiUrl: string;
    contentApiWsdl: string;
    contentApiUsername: string;
    contentApiPassword: string;
    contentApiRequestMethod: Method | string;
    useContentApiProxy: boolean;
    contentApiProxy: string;
    contentApiProxyPort: number;
    contentApiProxyUsername: string;
    contentApiProxyPassword: string;
  };
  app: {
    aggregatorOrgId: string;
    aggregatorPrivateKey: string;
    aggregatorPrivateKeyID: string;
  };
  db: {
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
    logging: string;
    useSSL: boolean;
    metadataTTL: number;
    sslCA: string;
    retryWrites: boolean;
  };
  simard: {
    url: string;
    jwt: string;
    timeoutMillis: number;
    virtualCardExpiryDays: number;
    simardOrgId: string;
  };
  log: {
    level: string;
    json: boolean;
    output: string;
  };
  orgIDValidator: {
    url: string;
    timeoutMillis: number;
    enabled: boolean;
  };
  orgIDValidatorV2: {
    url: string;
    timeoutMillis: number;
    enabled: boolean;
  };
  redis: {
    host: string;
    port: number;
    expiryTime: number;
    username: string;
    password: string;
    cacheEnabled: boolean;
    tlsEnabled: boolean;
  };
  distributionRules: {
    enabled: boolean;
    url: string;
  };
  pciProxy: {
    enabled: boolean;
  };
  jobs: {
    hotelsSyncIntervalHours: number;
    ghostBookingResolutionIntervalMinutes: number;
  };

  node: string;
  isProduction: boolean;
  isTest: boolean;
  isDevelopment: boolean;
  isUAT: boolean;
  offlineMode?: boolean;
  showRawResponse: boolean;
}

export class ConfigService {
  private useEnvConfig: boolean;

  constructor(useEnvConfig = true) {
    this.useEnvConfig = useEnvConfig;
  }

  public getConfig(section?: keyof Config): Config | Config[keyof Config] {
    if (this.useEnvConfig) {
      return this.getEnvConfig(section);
    }

    // implement http service for config

    throw new HotelOTAError("No valid config source defined");
  }

  private getSuppliers(): Suppliers {
    // throw on errors
    // load suppliers from JSON file
    let suppliersJson, suppliersObject;
    try {
      suppliersJson = readFileSync("./suppliers.json", { encoding: "utf-8" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error("'suppliers.json' file not found!");
      } else {
        throw error;
      }
    }

    try {
      suppliersObject = JSON.parse(suppliersJson);
    } catch (error) {
      throw new Error(`Error parsing JSON: ` + (error as Error).message);
    }

    // convert to objects and validate
    const suppliers = plainToInstance(Suppliers, suppliersObject);
    return suppliers;
  }

  private getEnvConfig(section?: string): Config | Config[keyof Config] {
    // get suppliers
    const suppliers = this.getSuppliers();
    const supplierIds = getSupplierIds(suppliers);

    // build config object
    const config: Config = {
      derbysoft: {
        distributorId: getOsEnv("DISTRIBUTOR_ID"),
        bookingAccessToken: getOsEnv("DERBYSOFT_BOOKING_ACCESS_TOKEN"),
        bookingBaseURL: getOsEnv("DERBYSOFT_BOOKING_BASE_URL"),
        shoppingAccessToken: getOsEnv("DERBYSOFT_SHOPPING_ACCESS_TOKEN"),
        shoppingBaseURL: getOsEnv("DERBYSOFT_SHOPPING_BASE_URL"),
        supplierIds,
        suppliers,
        contentApiUrl: getOsEnv("DERBYSOFT_CONTENT_API_URL"),
        contentApiWsdl: getOsEnv("DERBYSOFT_CONTENT_API_WSDL"),
        contentApiRequestMethod: getOsEnvOptional("DERBYSOFT_CONTENT_API_REQUEST_METHOD") ?? "POST",
        contentApiUsername: getOsEnv("DERBYSOFT_CONTENT_API_USERNAME"),
        contentApiPassword: getOsEnv("DERBYSOFT_CONTENT_API_PASSWORD"),
        useContentApiProxy: toBool(getOsEnvOptional("DERBYSOFT_CONTENT_API_USE_PROXY") ?? "false"),
        contentApiProxy: getOsEnvOptional("DERBYSOFT_CONTENT_API_PROXY"),
        contentApiProxyUsername: getOsEnvOptional("DERBYSOFT_CONTENT_API_PROXY_USERNAME"),
        contentApiProxyPassword: getOsEnvOptional("DERBYSOFT_CONTENT_API_PROXY_PASSWORD"),
        contentApiProxyPort: toNumber(getOsEnvOptional("DERBYSOFT_CONTENT_API_PROXY_PORT") ?? "0"),
      },
      app: {
        aggregatorOrgId: getOsEnv("APP_AGGREGATOR_ORGID"),
        aggregatorPrivateKey: toMultiline(getOsEnv("APP_AGGREGATOR_PRIVATE_KEY")),
        aggregatorPrivateKeyID: getOsEnv("APP_AGGREGATOR_PRIVATE_KEY_ID"),
      },

      simard: {
        url: getOsEnv("SIMARD_URL"),
        jwt: getOsEnv("SIMARD_JWT"),
        timeoutMillis: toNumber(getOsEnv("SIMARD_TIMEOUT_MILLIS")),
        virtualCardExpiryDays: toNumber(getOsEnv("SIMARD_VIRTUAL_CARD_EXPIRY_DAYS")),
        simardOrgId: getOsEnv("SIMARD_ORGID"),
      },

      db: {
        type: getOsEnv("TYPEORM_CONNECTION"),
        host: getOsEnvOptional("TYPEORM_HOST"),
        port: toNumber(getOsEnvOptional("TYPEORM_PORT")),
        username: getOsEnvOptional("TYPEORM_USERNAME"),
        password: getOsEnvOptional("TYPEORM_PASSWORD"),
        database: getOsEnv("TYPEORM_DATABASE"),
        synchronize: toBool(getOsEnvOptional("TYPEORM_SYNCHRONIZE")),
        logging: getOsEnv("TYPEORM_LOGGING"),
        useSSL: toBool(getOsEnv("TYPEORM_USE_SSL")),
        retryWrites: toBool(getOsEnv("TYPEORM_RETRY_WRITES") ?? "false"),
        metadataTTL: toNumber(getOsEnvOptional("TYPEORM_METADATA_TTL_SECONDS") ?? "1800"),
        sslCA: toBool(getOsEnv("TYPEORM_USE_SSL")) ? getOsEnv("TYPEORM_SSL_CA") : "",
      },
      log: {
        level: getOsEnv("LOG_LEVEL"),
        json: toBool(getOsEnvOptional("LOG_JSON")),
        output: getOsEnv("LOG_OUTPUT"),
      },
      orgIDValidator: {
        url: getOsEnv("ORGIDVALIDATOR_URL"),
        timeoutMillis: toNumber(getOsEnv("ORGIDVALIDATOR_TIMEOUT_MILLIS")),
        enabled: toBool(getOsEnvOptional("ORG_JWT_VALIDATION_ENABLED") ?? "false"),
      },
      orgIDValidatorV2: {
        url: getOsEnvOptional("ORGIDVALIDATOR_V2_URL"),
        timeoutMillis: toNumber(getOsEnv("ORGIDVALIDATOR_TIMEOUT_MILLIS")),
        enabled: toBool(getOsEnvOptional("ORG_JWT_VALIDATION_V2_ENABLED") ?? "false"),
      },
      distributionRules: {
        enabled: toBool(getOsEnvOptional("DISTRIBUTION_RULES_ENABLED") ?? "false"),
        url: getOsEnvOptional("DISTRIBUTION_RULES_URL"),
      },
      redis: {
        host: getOsEnv("REDIS_HOST"),
        port: toNumber(getOsEnv("REDIS_PORT")),
        expiryTime: toNumber(getOsEnv("REDIS_CACHE_EXPIRY_TIME")) * 1000,
        username: getOsEnv("REDIS_USERNAME"),
        password: getOsEnv("REDIS_PASSWORD"),
        cacheEnabled: toBool(getOsEnv("REDIS_CACHE_ENABLED")),
        tlsEnabled: toBool(getOsEnvOptional("REDIS_TLS_ENABLED") ?? "false"),
      },
      pciProxy: {
        enabled: toBool(getOsEnvOptional("PCIPROXY_ENABLED") ?? "true"),
      },
      jobs: {
        hotelsSyncIntervalHours: toNumber(getOsEnvOptional("HOTEL_SYNC_INTERVAL_HOURS") ?? "6"),
        ghostBookingResolutionIntervalMinutes: toNumber(
          getOsEnvOptional("GHOST_BOOKING_RESOLUTION_INTERVAL_MINUTES") ?? "1"
        ),
      },
      node: process.env.NODE_ENV || "development",
      isProduction: process.env.NODE_ENV === "production",
      isTest: process.env.NODE_ENV === "test",
      isDevelopment: process.env.NODE_ENV === "development",
      isUAT: toBool(getOsEnvOptional("IS_UAT") ?? "false"),
      offlineMode: toBool(getOsEnvOptional("OFFLINE_MODE") ?? "false"),
      showRawResponse: toBool(getOsEnvOptional("SHOW_RAW_RESPONSE") ?? "false"),
    };

    return section ? config[section] : config;
  }
}
