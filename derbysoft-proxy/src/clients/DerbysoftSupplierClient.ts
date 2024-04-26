import {
  AxiosError,
  generateUUID,
  isAxiosError,
  getLogger,
  PciProxyClient,
  RestClient,
} from "@simardwt/winding-tree-utils";
import {
  BookingUsbBookReservationRequest,
  BookingUsbBookReservationResponse,
  BookingUsbCancelReservationRequest,
  BookingUsbCancelReservationResponse,
  BookingUsbHotelListResponse,
  BookingUsbHotelProductsResponse,
  BookingUsbModifyReservationRequest,
  BookingUsbModifyReservationResponse,
  BookingUsbPreBookReservationRequest,
  BookingUsbQueryReservationDetailRequest,
  BookingUsbQueryReservationDetailResponse,
  BookingUsbQueryReservationRequest,
  BookingUsbQueryReservationResponse,
  BookingUsbReservationLiveCheckRequest,
  BookingUsbReservationLiveCheckResponse,
  DateRange,
  PreBookReservationParams,
  ReservationExtensions,
  ReservationHeader,
  ReservationIds,
  ReservationLiveCheckParameters,
  ShoppingHeader,
  ShoppingUsbHotelSetupRequest,
  ShoppingUsbHotelSetupResponse,
  ShoppingUsbMultiHotelSearchRequest,
  ShoppingUsbMultiHotelSearchResponse,
  SupplierHotel,
  ThreeDomainSecurity,
  MultiHotelSearchParams,
  BookingUsbReservationPreBookResponse,
  DerbysoftErrorResponse,
} from "@simardwt/derbysoft-types";
import { DerbysoftError, isDerbysoftErrorResponse } from "../utils/derbysoftErrorUtils";
import { plainToClass, plainToInstance } from "class-transformer";

interface RequestHeaders {
  Authorization: string;
}

type EnforceSupplierId<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown
    ? (supplierId: string, ...args: unknown[]) => unknown
    : T[K];
};

export class DerbysoftSupplierClient implements EnforceSupplierId<DerbysoftSupplierClient> {
  private log = getLogger(__filename, {
    topic: "derbysoft-client-traffic",
  });

  get distributorId(): string {
    return this._distributorId;
  }

  get bookingBaseURL(): string {
    return this._bookingBaseURL;
  }

  get shoppingBaseURL(): string {
    return this._shoppingBaseURL;
  }

  private restClient: RestClient;
  private pciProxyClient: PciProxyClient;
  protected shoppingRequestHeaders: RequestHeaders;
  protected bookingRequestHeaders: RequestHeaders;
  protected requestTimeout = 60000;

  constructor(
    protected _distributorId: string,
    protected _bookingAccessToken: string,
    protected _bookingBaseURL: string,
    protected _shoppingAccessToken: string,
    protected _shoppingBaseURL: string
  ) {
    this.restClient = new RestClient();
    this.pciProxyClient = new PciProxyClient();
    this.shoppingRequestHeaders = {
      Authorization: `Bearer ${this._shoppingAccessToken}`,
    };

    this.bookingRequestHeaders = {
      Authorization: `Bearer ${this._bookingAccessToken}`,
    };

    // set global REST client error handler
    this.restClient.setGlobalErrorHandler(this.restClientErrorHandler);
    this.pciProxyClient.setGlobalErrorHandler(this.restClientErrorHandler);
    this.init();
  }

  private getBookingHeader(supplierId: string) {
    return new ReservationHeader(supplierId, this.distributorId, "v4", generateUUID());
  }

  private getShoppingHeader() {
    return new ShoppingHeader(this.distributorId, "v4", generateUUID());
  }

  // ping booking API
  private async pingBookingAPI() {
    const pingUrl = this.bookingBaseURL + `/ping?distributorId=${this.distributorId}`;
    this.log.debug("Pinging bookingUSB API... " + pingUrl);
    return this.restClient.getCall(pingUrl, this.bookingRequestHeaders, this.requestTimeout);
  }

  // ping shopping API
  private async pingShoppingAPI() {
    const pingUrl = this.shoppingBaseURL + `/ping?distributorId=${this.distributorId}`;
    this.log.debug("Pinging shoppingUSB API... " + pingUrl);
    return this.restClient.getCall(pingUrl, this.shoppingRequestHeaders, this.requestTimeout);
  }

  // initialize supplier
  private async init() {
    // ensure APIs are reachable
    try {
      await this.pingBookingAPI();
      await this.pingShoppingAPI();
    } catch (error) {
      // eslint-disable-next-line no-console
      throw new Error(
        "An error occurred reaching Derbysoft endpoints. Error: " + (error as Error).message
      );
    }
  }

  // global REST client errorHandler
  private restClientErrorHandler = (error: unknown) => {
    if (isAxiosError(error)) {
      const err = error as AxiosError;

      // check if it is a derbysoft error response
      if (err.response?.status === 500 && isDerbysoftErrorResponse(err.response?.data)) {
        throw new DerbysoftError(
          "Derbysoft Error",
          500,
          err.response?.data as DerbysoftErrorResponse
        );
      } else if (err.response?.status === 401) {
        throw new DerbysoftError("Authentication failure", 511);
      } else if (err.response?.status === 503) {
        throw new DerbysoftError("Service is currently unavailable", 503);
      }
    }
  };

  // setup hotels
  public async setupHotels(
    supplierId: string,
    hotels: SupplierHotel[]
  ): Promise<ShoppingUsbHotelSetupResponse> {
    const setupHotelRequest = new ShoppingUsbHotelSetupRequest(this.getShoppingHeader(), hotels);
    const setupHotelsUrl = this.shoppingBaseURL + `/hotels/${supplierId}/setup`;
    const responsePlain = await this.restClient.postCall(
      setupHotelsUrl,
      this.shoppingRequestHeaders,
      setupHotelRequest,
      this.requestTimeout
    );
    return plainToClass(ShoppingUsbHotelSetupResponse, responsePlain);
  }

  // search multiple hotels
  public async searchMultiHotels(
    supplierId: string,
    params: MultiHotelSearchParams
  ): Promise<ShoppingUsbMultiHotelSearchResponse> {
    const searchHotelsRequest = new ShoppingUsbMultiHotelSearchRequest(
      this.getShoppingHeader(),
      params
    );

    this.log.debug("DERBYSOFT_AVAILABILITY_RQ", searchHotelsRequest);

    const setupHotelsUrl = this.shoppingBaseURL + `/shopping/multihotels`;
    const responsePlain = await this.restClient.postCall<ShoppingUsbMultiHotelSearchResponse>(
      setupHotelsUrl,
      this.shoppingRequestHeaders,
      searchHotelsRequest,
      this.requestTimeout
    );

    this.log.debug("DERBYSOFT_AVAILABILITY_RS", responsePlain);
    return plainToClass(ShoppingUsbMultiHotelSearchResponse, responsePlain);
  }

  // list hotels
  public async listHotels(supplierId: string): Promise<BookingUsbHotelListResponse[]> {
    const listHotelsUrl =
      this.bookingBaseURL + `/hotels/${supplierId}?distributorId=${this.distributorId}`;

    // Error TS2739 when trying to apply plainToInstance or plainToClass here (probably due to the array)...
    const responsePlain = await this.restClient.getCall<BookingUsbHotelListResponse[]>(
      listHotelsUrl,
      this.bookingRequestHeaders,
      this.requestTimeout
    );
    return plainToInstance(BookingUsbHotelListResponse, responsePlain);
  }

  // list hotel products
  public async listHotelProducts(
    supplierId: string,
    hotelId: string
  ): Promise<BookingUsbHotelProductsResponse> {
    const listHotelsUrl =
      this.bookingBaseURL + `/hotel/${supplierId}/${hotelId}?distributorId=${this.distributorId}`;

    const responsePlain = await this.restClient.getCall(
      listHotelsUrl,
      this.bookingRequestHeaders,
      this.requestTimeout
    );
    return plainToClass(BookingUsbHotelProductsResponse, responsePlain);
  }

  // search single hotel (live check)
  public async searchHotel(
    supplierId: string,
    params: ReservationLiveCheckParameters
  ): Promise<BookingUsbReservationLiveCheckResponse> {
    const searchHotelRequest = new BookingUsbReservationLiveCheckRequest(
      this.getBookingHeader(supplierId),
      params
    );

    this.log.debug("DERBYSOFT_LIVE_AVAILABILITY_RQ", searchHotelRequest);

    const searchHotelUrl = this.bookingBaseURL + `/availability`;
    const responsePlain = await this.restClient.postCall<BookingUsbReservationLiveCheckResponse>(
      searchHotelUrl,
      this.bookingRequestHeaders,
      searchHotelRequest,

      this.requestTimeout
    );

    this.log.debug("DERBYSOFT_LIVE_AVAILABILITY_RS", responsePlain);
    return plainToClass(BookingUsbReservationLiveCheckResponse, responsePlain);
  }

  // prebook hotel room
  public async preBook(
    supplierId: string,
    params: PreBookReservationParams
  ): Promise<BookingUsbReservationPreBookResponse> {
    const prebookRequest = new BookingUsbPreBookReservationRequest(
      this.getBookingHeader(supplierId),
      params
    );

    this.log.debug("DERBYSOFT_PREBOOK_RQ", prebookRequest);

    const prebookUrl = this.bookingBaseURL + `/reservation/prebook`;
    const responsePlain = await this.restClient.postCall<BookingUsbReservationPreBookResponse>(
      prebookUrl,
      this.bookingRequestHeaders,
      prebookRequest,

      this.requestTimeout
    );

    this.log.debug("DERBYSOFT_PREBOOK_RS", responsePlain);
    return plainToClass(BookingUsbReservationPreBookResponse, responsePlain);
  }

  // book (reserve) hotel reservation
  public async bookReservation(
    supplierId: string,
    bookingParams: PreBookReservationParams,
    bookingToken: string,
    usePciProxy = true,
    threeDomainSecurity?: ThreeDomainSecurity
  ): Promise<BookingUsbBookReservationResponse> {
    const bookReservationRequest = new BookingUsbBookReservationRequest(
      this.getBookingHeader(supplierId),
      bookingParams,
      bookingToken,
      threeDomainSecurity
    );

    this.log.debug("DERBYSOFT_BOOKING_RQ", bookReservationRequest);

    const bookUrl = this.bookingBaseURL + `/reservation/book`;
    let responsePlain;
    if (usePciProxy) {
      responsePlain = await this.pciProxyClient.postCall<BookingUsbBookReservationResponse>(
        bookUrl,
        this.bookingRequestHeaders,
        bookReservationRequest,
        this.requestTimeout
      );
    } else {
      responsePlain = await this.restClient.postCall<BookingUsbBookReservationResponse>(
        bookUrl,
        this.bookingRequestHeaders,
        bookReservationRequest,

        this.requestTimeout
      );
    }

    this.log.debug("DERBYSOFT_BOOKING_RS", responsePlain);
    return plainToClass(BookingUsbBookReservationResponse, responsePlain);
  }

  // modify reservation/booking
  public async modifyReservation(
    supplierId: string,
    bookingParams: PreBookReservationParams,
    threeDomainSecurity?: ThreeDomainSecurity
  ): Promise<BookingUsbModifyReservationResponse> {
    const modifyReservationRequest = new BookingUsbModifyReservationRequest(
      this.getBookingHeader(supplierId),
      bookingParams,
      threeDomainSecurity
    );

    const modifyUrl = this.bookingBaseURL + `/reservation/modify`;

    const responsePlain = await this.restClient.postCall<BookingUsbModifyReservationResponse>(
      modifyUrl,
      this.bookingRequestHeaders,
      modifyReservationRequest,

      this.requestTimeout
    );

    return plainToClass(BookingUsbModifyReservationResponse, responsePlain);
  }

  // cancel reservation/booking
  public async cancelReservation(
    supplierId: string,
    reservationIds: ReservationIds,
    extensions?: ReservationExtensions
  ): Promise<BookingUsbCancelReservationResponse> {
    const cancelReservationRequest = new BookingUsbCancelReservationRequest(
      this.getBookingHeader(supplierId),
      reservationIds,
      extensions
    );

    this.log.debug("DERBYSOFT_CANCEL_RESERVATION_RQ", cancelReservationRequest);

    const cancelUrl = this.bookingBaseURL + `/reservation/cancel`;
    const responsePlain = await this.restClient.postCall<BookingUsbCancelReservationResponse>(
      cancelUrl,
      this.bookingRequestHeaders,
      cancelReservationRequest,

      this.requestTimeout
    );

    this.log.debug("DERBYSOFT_CANCEL_RESERVATION_RS", responsePlain);
    return plainToClass(BookingUsbCancelReservationResponse, responsePlain);
  }

  // view reservation/booking
  public async queryReservationSummary(
    supplierId: string,
    dateRange: DateRange,
    hotelId: string
  ): Promise<BookingUsbQueryReservationResponse> {
    const queryReservationRequest = new BookingUsbQueryReservationRequest(
      this.getBookingHeader(supplierId),
      dateRange,
      hotelId
    );

    const queryUrl = this.bookingBaseURL + `/reservations`;

    const responsePlain = await this.restClient.postCall<BookingUsbQueryReservationResponse>(
      queryUrl,
      this.bookingRequestHeaders,
      queryReservationRequest,

      this.requestTimeout
    );

    return plainToClass(BookingUsbQueryReservationResponse, responsePlain);
  }

  // view reservation/booking details
  public async queryReservationDetail(
    supplierId: string,
    reservationIds: ReservationIds
  ): Promise<BookingUsbQueryReservationDetailResponse> {
    const queryReservationRequest = new BookingUsbQueryReservationDetailRequest(
      this.getBookingHeader(supplierId),
      reservationIds
    );

    this.log.debug("DERBYSOFT_QUERY_RESERVATION_RQ", queryReservationRequest);
    const queryUrl = this.bookingBaseURL + `/reservation/detail`;

    const responsePlain = await this.restClient.postCall<BookingUsbQueryReservationDetailResponse>(
      queryUrl,
      this.bookingRequestHeaders,
      queryReservationRequest,

      this.requestTimeout
    );

    this.log.debug("DERBYSOFT_QUERY_RESERVATION_RS", responsePlain);
    return plainToClass(BookingUsbQueryReservationDetailResponse, responsePlain);
  }
}
