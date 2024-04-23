import * as dotenv from 'dotenv';
import * as path from 'path';
import * as pkg from '../package.json';
import {
    getOsEnv, getOsEnvArray, getOsEnvOptional, getOsPath, getOsPaths, normalizePort, toBool, toMultiline, toNumber
} from './lib/env';

/**
 * Load .env file or for tests the .env.test file.
 */
const dotEnvPath = path.join(process.cwd(), `.env${((process.env.NODE_ENV === 'test') ? '.test' : '')}`);
console.log(`Loading environment/config from file:[${dotEnvPath}]`);
dotenv.config({ path: dotEnvPath });

// load version details from .version file
dotenv.config({ path: path.join(process.cwd(), '.version') });
console.log('GIT VERSION:', getOsEnvOptional('GIT_BRANCH_NAME'));
/**
 * Environment variables
 */
export interface FarelogixConfiguration {
    providerID: string;
    url: string;
    airlineCode: string;
    username: string;
    password: string;
    agentName: string;
    agentPassword: string;
    agencyPCC: string;
    agencyIATA: string;
    apiKey: string;
    agencyName: string;
    pointOfSaleCity: string;
    pointOfSaleCountry: string;
    currencyCode: string;
    corporateCode: string;
    accountCode: string;
    fareLogixTrace: string;
    fareLogixScriptEngine: string;
    fareLogixScriptName: string;
    fareLogixAirlineId: string;
    corporateParticipantID: string;
    corporateParticipantName: string;
    cabinPreferences: string[];
    serviceFilters: string[];   // array of semicolon separated values GroupCode:SubGroupCode (example BE:B99),
    tourCode: string;
}

/**
 * If isEnabled = true it creates new instance of FarelogixConfiguration based on environment variables with prefix provided as parameter
 * If isEnabled = false, it return undefined
 * @param isEnabled
 * @param prefix, Example: if prefix is 'AA', it will look for env variables such as AA_WEBSERVICE_URL, AA_USERNAME,....
 */
export function conditionallyCreateFarelogixConfiguration(isEnabled: boolean, prefix: string): FarelogixConfiguration {
    if (!isEnabled) {
        return undefined;
    }
    try {
        const config: FarelogixConfiguration = {
            providerID: getOsEnv(`${prefix}_PROVIDERID`),
            url: getOsEnv(`${prefix}_WEBSERVICE_URL`),
            airlineCode: getOsEnv(`${prefix}_AIRLINE_CODE`),
            fareLogixTrace: getOsEnv(`${prefix}_FLX_TRACE`),
            fareLogixScriptEngine: getOsEnv(`${prefix}_FLX_SCRIPT_ENGINE`),
            fareLogixScriptName: getOsEnv(`${prefix}_FLX_SCRIPT_NAME`),
            fareLogixAirlineId: getOsEnv(`${prefix}_FLX_AIRLINE_ID`),
            username: getOsEnv(`${prefix}_USERNAME`),
            password: getOsEnv(`${prefix}_PASSWORD`),
            agentName: getOsEnv(`${prefix}_AGENTNAME`),
            agentPassword: getOsEnv(`${prefix}_AGENTPASS`),
            agencyPCC: getOsEnv(`${prefix}_AGENCY_PCC`),
            agencyIATA: getOsEnv(`${prefix}_AGENCY_IATA`),
            apiKey: getOsEnv(`${prefix}_API_KEY`),
            agencyName: getOsEnv(`${prefix}_AGENCYNAME`),
            pointOfSaleCity: getOsEnv(`${prefix}_POS_CITY`),
            pointOfSaleCountry: getOsEnv(`${prefix}_POS_COUNTRY`),
            currencyCode: getOsEnv(`${prefix}_CURRENCY_CODE`),
            corporateCode: getOsEnvOptional(`${prefix}_CORPORATE_CODE`),
            accountCode: getOsEnvOptional(`${prefix}_ACCOUNT_CODE`),
            corporateParticipantID: getOsEnv(`${prefix}_CORPORATE_PARTICIPANT_ID`),
            corporateParticipantName: getOsEnv(`${prefix}_CORPORATE_PARTICIPANT_NAME`),
            cabinPreferences: getOsEnvArray(`${prefix}_CABIN_PREFERENCES`),
            serviceFilters: getOsEnvArray(`${prefix}_SERVICE_PREFERENCES`),
            tourCode: getOsEnvOptional(`${prefix}_TOUR_CODE`),
        };
        return config;
    } catch (err: any) {
        throw new Error(`Failed to create new instance of FarelogixConfiguration with prefix:${prefix}, cause:${err.message}`);
    }
}

export const env = {
    node: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    isDevelopment: process.env.NODE_ENV === 'development',
    AA_BUSINESS: conditionallyCreateFarelogixConfiguration(toBool(getOsEnv('AABUSINESS_ENABLED')), 'AABUSINESS'),
    AA_BUSINESS_isEnabled: toBool(getOsEnv('AABUSINESS_ENABLED')),
    AA_LEISURE: conditionallyCreateFarelogixConfiguration(toBool(getOsEnv('AALEISURE_ENABLED')), 'AALEISURE'),
    AA_LEISURE_isEnabled: toBool(getOsEnv('AALEISURE_ENABLED')),
    UA_LEISURE: conditionallyCreateFarelogixConfiguration(toBool(getOsEnv('UALEISURE_ENABLED')), 'UALEISURE'),
    UA_LEISURE_isEnabled: toBool(getOsEnv('UALEISURE_ENABLED')),
    UA_BUSINESS: conditionallyCreateFarelogixConfiguration(toBool(getOsEnv('UABUSINESS_ENABLED')), 'UABUSINESS'),
    UA_BUSINESS_isEnabled: toBool(getOsEnv('UABUSINESS_ENABLED')),
    app: {
        name: getOsEnv('APP_NAME'),
        env: getOsEnv('APP_ENV'),
        version: (pkg as any).version,
        description: (pkg as any).description,
        host: getOsEnv('APP_HOST'),
        schema: getOsEnv('APP_SCHEMA'),
        routePrefix: getOsEnv('APP_ROUTE_PREFIX'),
        port: normalizePort(process.env.PORT || getOsEnv('APP_PORT')),
        banner: toBool(getOsEnv('APP_BANNER')),
        aggregatorOrgId: getOsEnv('APP_AGGREGATOR_ORGID'),
        aggregatorPrivateKey: toMultiline(getOsEnv('APP_AGGREGATOR_PRIVATE_KEY')),
        aggregatorPrivateKeyID: getOsEnv('APP_AGGREGATOR_PRIVATE_KEY_ID'),
        dirs: {
            migrations: getOsPaths('TYPEORM_MIGRATIONS'),
            migrationsDir: getOsPath('TYPEORM_MIGRATIONS_DIR'),
            entities: getOsPaths('TYPEORM_ENTITIES'),
            entitiesDir: getOsPath('TYPEORM_ENTITIES_DIR'),
            controllers: getOsPaths('CONTROLLERS'),
            middlewares: getOsPaths('MIDDLEWARES'),
            interceptors: getOsPaths('INTERCEPTORS'),
            subscribers: getOsPaths('SUBSCRIBERS'),
            resolvers: getOsPaths('RESOLVERS'),
            logs: getOsEnv('LOGS_DIR'),
        },
    },
    log: {
        level: getOsEnv('LOG_LEVEL'),
        json: toBool(getOsEnvOptional('LOG_JSON')),
        output: getOsEnv('LOG_OUTPUT'),
        grafana_url: getOsEnv('LOG_GRAFANA_URL'),
        grafana_auth: getOsEnv('LOG_GRAFANA_AUTH'),
    },
    db: {
        type: getOsEnv('TYPEORM_CONNECTION'),
        host: getOsEnvOptional('TYPEORM_HOST'),
        port: toNumber(getOsEnvOptional('TYPEORM_PORT')),
        username: getOsEnvOptional('TYPEORM_USERNAME'),
        password: getOsEnvOptional('TYPEORM_PASSWORD'),
        database: getOsEnv('TYPEORM_DATABASE'),
        synchronize: toBool(getOsEnvOptional('TYPEORM_SYNCHRONIZE')),
        logging: getOsEnv('TYPEORM_LOGGING'),
        useSSL: toBool(getOsEnv('TYPEORM_USE_SSL')),
        sslCA: getOsEnv('TYPEORM_SSL_CA'),
    },
    swagger: {
        enabled: toBool(getOsEnv('SWAGGER_ENABLED')),
        route: getOsEnv('SWAGGER_ROUTE'),
        username: getOsEnv('SWAGGER_USERNAME'),
        password: getOsEnv('SWAGGER_PASSWORD'),
    },
    monitor: {
        enabled: toBool(getOsEnv('MONITOR_ENABLED')),
        route: getOsEnv('MONITOR_ROUTE'),
        username: getOsEnv('MONITOR_USERNAME'),
        password: getOsEnv('MONITOR_PASSWORD'),
    },
    cluster: {
        healthCheckEnabled: toBool(getOsEnv('CLUSTER_HEALTHCHECK_ENABLED')),
        isMaster: getOsEnv('CLUSTER_NODE_TYPE') === 'master',
        isSlave: getOsEnv('CLUSTER_NODE_TYPE') !== 'master',
        healthCheckInMillis: toNumber(getOsEnv('CLUSTER_HEALTHCHECK_FREQUENCY')),
        healthCheckTimeoutInMillis: toNumber(getOsEnvOptional('CLUSTER_HEALTHCHECK_TIMEOUT')),
    },
    orgID: {
        orgIdAddress: getOsEnv('ORGID_CONTRACT_ADDRESS'),
        lifDepositAddress: getOsEnv('ORGID_LIF_DEPOSIT_CONTRACT_ADDRESS'),
        infuraURI: getOsEnv('ORGID_INFURA_URL'),
        minLifDepositRequired: toNumber(getOsEnv('ORG_MIN_LIF_DEPOSIT_REQUIRED')),
        jwtValidationEnabled: toBool(getOsEnv('ORG_JWT_VALIDATION_ENABLED')),
    },
    orgIDValidator: {
        url: getOsEnv('ORGIDVALIDATOR_URL'),
        timeoutMillis: toNumber(getOsEnv('ORGIDVALIDATOR_TIMEOUT_MILLIS')),
    },
    orgIDValidatorV2: {
        url: getOsEnv('ORGIDVALIDATORV2_URL'),
        enabled: toBool(getOsEnv('ORGIDVALIDATOR_V2_ENABLED')),
        timeoutMillis: toNumber(getOsEnv('ORGIDVALIDATOR_TIMEOUT_MILLIS')),
    },
    simardPay: {
        url: getOsEnv('SIMARD_PAY_URL'),
        jwt: getOsEnv('SIMARD_PAY_JWT'),
        timeoutMillis: toNumber(getOsEnv('SIMARD_PAY_TIMEOUT_MILLIS')),
        virtualCardExpiryDays: toNumber(getOsEnv('SIMARD_PAY_VIRTUAL_CARD_EXPIRY_DAYS')),
        orgId: getOsEnv('SIMARD_PAY_ORGID'),
    },
    hotels: {
        defaultSearchRadiusInKm: toNumber(getOsEnv('HOTELS_SEARCH_RADIUS')),
    },
    pciproxy: {
        merchantID: getOsEnv('PCIPROXY_MERCHANT_ID'),
        apiKey: getOsEnv('PCIPROXY_APIKEY'),
        url: getOsEnv('PCIPROXY_URL'),
        isEnabled: toBool(getOsEnv('PCIPROXY_ENABLED')),
    },
    redis: {
        host: getOsEnv('REDIS_HOST'),
        port: toNumber(getOsEnv('REDIS_PORT')),
        expiryTime: toNumber(getOsEnv('REDIS_CACHE_EXPIRY_TIME')) * 1000,
        username: getOsEnv('REDIS_USERNAME'),
        password: getOsEnv('REDIS_PASSWORD'),
        cacheEnabled: toBool(getOsEnv('REDIS_CACHE_ENABLED')),
        tlsEnabled: toBool(getOsEnv('REDIS_TLS_ENABLED')),
        keyPrefix: getOsEnvOptional('REDIS_KEY_PREFIX') || 'ndcproxy',
    },
    gitVersion: {
        branch: getOsEnvOptional('GIT_BRANCH_NAME'),
        commit: getOsEnvOptional('GIT_COMMIT_HASH'),
        generatedAt: getOsEnvOptional('GIT_VERSION_TIMESTAMP'),
    },
    stripe: {
        key: getOsEnv('STRIPE_KEY'),
        url: getOsEnv('STRIPE_URL'),
        bookingFeeAmount: toNumber(getOsEnv('STRIPE_BOOKING_FEE_AMOUNT')),
        bookingFeeCurrency: getOsEnv('STRIPE_BOOKING_FEE_CURRENCY'),
        bookingFeeDescription: getOsEnv('STRIPE_BOOKING_FEE_DESCRIPTION'),
    },
    dataTrans: {
        merchantId: getOsEnv('DATATRANS_MERCHANT_ID'),
        password: getOsEnv('DATATRANS_PASSWORD'),
        dataTransUrl: getOsEnv('DATATRANS_URL'),
        bookingFeeAmount: toNumber(getOsEnv('DATATRANS_BOOKING_FEE_AMOUNT')),
        bookingFeeCurrency: getOsEnv('DATATRANS_BOOKING_FEE_CURRENCY'),
        bookingFeeDescription: getOsEnv('DATATRANS_BOOKING_FEE_DESCRIPTION'),
    },
};

export const testenv = {
    gliderOTAOrgId: getOsEnvOptional('TEST_OTA_ORGID'),
    gliderOTAPrivateKey: toMultiline(getOsEnvOptional('TEST_OTA_PRIVATE_KEY')), // it's needed for some tests to simulate making calls to Simard on behalf of Glider OTA
    gliderOTAPrivateKeyID: getOsEnvOptional('TEST_OTA_PRIVATE_KEY_ID'),
    eyLeiureOrgID: getOsEnvOptional('TEST_ORGID_EY_LEISURE'),
    eyLeiureJWT: getOsEnvOptional('TEST_JWT_EY_LEISURE'),
    eyBusinessOrgID: getOsEnvOptional('TEST_ORGID_EY_BUSINESS'),
    eyBusinessJWT: getOsEnvOptional('TEST_JWT_EY_BUSINESS'),
    uaOrgID: '0x123456789012345678901234567890123456789012345678901234567890',
    uaJWT: 'qwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiop',
};
