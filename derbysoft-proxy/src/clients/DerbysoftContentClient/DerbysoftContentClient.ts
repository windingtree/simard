import { Client as SoapClient, createClientAsync as soapCreateClientAsync } from "soap";
import { OtaHotelSearchRq } from "@simardwt/ota-types";
import { OtaHotelSearchRs } from "@simardwt/ota-types";
import { OtaHotelDescriptiveInfoRq } from "@simardwt/ota-types";
import { OtaHotelDescriptiveInfoRs } from "@simardwt/ota-types";
import { HotelContentService } from "./services/HotelContentService";

export interface DerbysoftContentClient extends SoapClient {
  HotelService: HotelContentService;
  GetChangeHotelsAsync(
    otaHotelSearchRq: OtaHotelSearchRq
  ): Promise<
    [result: OtaHotelSearchRs, rawResponse: unknown, soapHeader: unknown, rawRequest: unknown]
  >;
  GetHotelDescriptiveInfoAsync(
    otaHotelDescriptiveInfoRq: OtaHotelDescriptiveInfoRq
  ): Promise<
    [
      result: OtaHotelDescriptiveInfoRs,
      rawResponse: unknown,
      soapHeader: unknown,
      rawRequest: unknown
    ]
  >;
}

/** Create DerbysoftClient */
export async function createClientAsync(
  ...args: Parameters<typeof soapCreateClientAsync>
): Promise<DerbysoftContentClient> {
  return soapCreateClientAsync(args[0], args[1], args[2]) as unknown as DerbysoftContentClient;
}
