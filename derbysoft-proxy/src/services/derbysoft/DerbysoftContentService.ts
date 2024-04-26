import {
  OtaHotelDescriptiveInfoRq,
  OtaHotelDescriptiveInfoRs,
  OtaHotelSearchRq,
} from "@simardwt/ota-types";

import {
  Profile,
  HotelRef,
  HotelDescriptiveContent,
  HotelDescriptiveInfo,
} from "@simardwt/ota-types";

import { ISoapError } from "soap/lib/client";
import { WSSecurity } from "soap";
import { getLogger } from "@simardwt/winding-tree-utils";
import { coerceArray, throttlePromises } from "../../utils/generalUtils";
import {
  createClientAsync,
  DerbysoftContentClient,
} from "../../clients/DerbysoftContentClient/DerbysoftContentClient";
import { DerbysoftContentService, HotelInfoMap } from "./types/ContentApi";
import { Config, ConfigService } from "../common/ConfigService";
import axios, { Method } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HotelOTAError, KeyValuePairs } from "../../types";

export type ContentApiError = {
  attributes: {
    Code: string;
    ShortText: string;
  };
};

export interface EmailElement {
  attributes: {
    EmailType: string;
  };
  $value: string;
}

export type ContentApiErrors = ContentApiError[];
export const parseContentApiErrors = (errors: ContentApiErrors | string[]) => {
  if (errors.length && typeof errors[0] === "string") {
    return errors;
  }
  const errorsArray = coerceArray(errors as ContentApiErrors);
  return errorsArray.map((err) => `[${err?.attributes?.Code}]: ${err?.attributes?.ShortText}`);
};

const env = new ConfigService().getConfig() as Config;

const username = env.derbysoft.contentApiUsername;
const password = env.derbysoft.contentApiPassword;
const apiUrl = env.derbysoft.contentApiUrl;
const apiWsdl = env.derbysoft.contentApiWsdl;

const replaceSecurityAttributes = (xml: string) => {
  // strip off all xmlns, Type attributes
  const regex = /\s?(?:xmlns:|Type|wsu:)\S*="\S+"/gi;
  let replacedXml = xml.replace(regex, "");

  // add security schema url
  const replacementText = `<wsse:Security xmlns:wsse="http://schemas.xmlsoap.org/ws/2003/06/secext" xmlns="http://schemas.xmlsoap.org/ws/2003/06/secext"`;
  replacedXml = replacedXml.replace(/<wsse:Security/gi, replacementText);

  return replacedXml;
};

const normalizeDate = (date: Date) => date?.toISOString().replace(/Z$/, "");

export class DerbysoftContentServiceFactory {
  private static readonly auth = new WSSecurity(username, password, {
    hasTimeStamp: false,
    hasTokenCreated: false,
  });

  private static logger = getLogger(__filename);

  private static readonly urlPath = apiUrl;
  private static readonly wsdlPath = apiWsdl;
  // path.resolve(path.join(__dirname, "../derbysoft.wsdl"));

  private static client: DerbysoftContentClient;
  private static serviceInstance: DerbysoftContentService;

  // get singleton instance of service from factory
  public static async getService(): Promise<DerbysoftContentService> {
    if (!this.client) {
      try {
        // build out options
        const options: KeyValuePairs = {};

        // check for proxy
        const useProxy = env.derbysoft.useContentApiProxy;
        if (useProxy) {
          const proxyAgent = new HttpsProxyAgent({
            protocol: "http",
            host: env.derbysoft.contentApiProxy,
            port: env.derbysoft.contentApiProxyPort,
            auth: `${env.derbysoft.contentApiProxyUsername}:${env.derbysoft.contentApiProxyPassword}`,
          });

          const requestDefaults = axios.create({
            method: env.derbysoft.contentApiRequestMethod as Method,
            httpsAgent: proxyAgent,
            httpAgent: proxyAgent,
          });

          options.request = requestDefaults;
        }

        this.client = await createClientAsync(this.wsdlPath, options);
        const securityHeader = replaceSecurityAttributes(this.auth.toXML());
        this.client.addSoapHeader(securityHeader);
        this.client.addHttpHeader("Connection", "keep-alive");
        this.client.setEndpoint(this.urlPath);
      } catch (error) {
        this.logger.error((error as Error).message);
        throw error;
      }
    }

    if (this.client && !this.serviceInstance) {
      this.serviceInstance = new DerbysoftContentServiceClass(this.client);
    }

    return this.serviceInstance;
  }
}

class DerbysoftContentServiceClass implements DerbysoftContentService {
  constructor(private client: DerbysoftContentClient) {}

  private _lastModifyDateTime: Date = new Date("2017-12-20");
  private log = getLogger(__filename);

  public set lastModifyDateTime(v: Date) {
    this._lastModifyDateTime = v;
  }

  public get lastModifyDateTime(): Date {
    return this._lastModifyDateTime;
  }

  // get all changed hotel info since last modify date
  public async getHotels(hotelCodeContext, lastModifyDateTime?: Date) {
    const LastModifyDateTime: string = normalizeDate(lastModifyDateTime || this.lastModifyDateTime);

    const profile: Profile = {
      attributes: {
        LastModifyDateTime,
      },
    };

    const searchRequest: OtaHotelSearchRq = {
      Criteria: {
        Criterion: [
          {
            HotelRef: [
              {
                attributes: {
                  HotelCodeContext: hotelCodeContext,
                },
              },
            ],
            Profiles: {
              ProfileInfo: [
                {
                  Profile: profile,
                },
              ],
            },
          },
        ],
      },
    };

    try {
      const [result] = await this.client.GetChangeHotelsAsync(searchRequest);
      const codes = result.Criteria?.Criterion?.reduce((acc: string[], criterion): string[] => {
        let refCodes: string[];

        if (Array.isArray(criterion.HotelRef)) {
          refCodes = criterion.HotelRef?.map((ref) => (ref as HotelRef).attributes.HotelCode);
        } else if (criterion.HotelRef) {
          refCodes = [(criterion.HotelRef as HotelRef).attributes.HotelCode];
        } else {
          refCodes = [];
        }
        acc.push(...refCodes);

        return acc;
      }, []);

      return codes || [];
    } catch (error) {
      this.log.error((error as ISoapError).message);

      throw error;
    }
  }

  // get all hotel info of specified hotel Ids
  public async getHotelsInfo(hotelCodeContext, hotelIds: string[]) {
    // assert array
    hotelIds = Array.isArray(hotelIds) ? hotelIds : [hotelIds];

    // define function
    const getHotelsInfoFunc = async (ids: string[]) => {
      // prepare RQ
      // map ids into descriptiveInfo objects
      const mappedInfo = ids.map(
        (id): HotelDescriptiveInfo => ({
          attributes: {
            HotelCode: id,
            HotelCodeContext: hotelCodeContext,
          },
        })
      );

      const hotelDescriptiveInfoRq: OtaHotelDescriptiveInfoRq = {
        HotelDescriptiveInfos: {
          HotelDescriptiveInfo: mappedInfo,
        },
      };

      try {
        const [result] = await this.client.GetHotelDescriptiveInfoAsync(hotelDescriptiveInfoRq);
        if (result.Errors) {
          const errors = parseContentApiErrors(result.Errors.Error);
          throw new HotelOTAError("Error retrieving data from Content API", undefined, errors);
        }
        return result;
      } catch (error) {
        this.log.error(
          `HotelCodeContext: ${hotelCodeContext} - ` + (error as Error).message,
          (error as HotelOTAError).errors
        );
        throw error;
      }
    };

    // 5 concurrent requests/25 hotel Ids each
    const hotelsInfo = await throttlePromises<string[]>(
      hotelIds,
      getHotelsInfoFunc,
      1000,
      true,
      // 5 items per iteration => 5 requests within given time
      // 25 chunks per item => 25 Ids in each request
      // equivalent to 125 Ids concurrently
      5,
      25
    );

    const result = (hotelsInfo as OtaHotelDescriptiveInfoRs[]).reduce((acc: HotelInfoMap, info) => {
      const content = info.HotelDescriptiveContents
        ?.HotelDescriptiveContent as HotelDescriptiveContent[];
      if (content && Array.isArray(content)) {
        content.forEach((item) => {
          const key = item.attributes.HotelCode;
          acc[key] = item;
        });
      }

      return acc;
    }, {});

    return result;
  }
}
