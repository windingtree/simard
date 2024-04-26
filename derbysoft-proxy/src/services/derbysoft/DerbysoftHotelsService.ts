import Container, { Service } from "typedi";
import { DerbysoftSupplierClient } from "../../clients/DerbysoftSupplierClient";
import { BaseHotelsService } from "../hotel/BaseHotelsService";
import { EDerbysoftHotel } from "../../database/models/EDerbysoftHotel";
import { HotelOTAError } from "../../types/shared/HotelOTAError";
import { Config, ConfigService } from "../common/ConfigService";
import {
  BookingUsbHotelProductsResponse,
  HotelProduct,
  BookingUsbEnhancedHotelProductsResponse,
} from "@simardwt/derbysoft-types";
import { EPhone } from "../../database/models/EPhone";
import { ERoomType } from "../../database/models/ERoomType";
import { EDerbysoftRoomTypeCustomData } from "../../types/database/EDerbysoftRoomTypeCustomData";
import { getLogger } from "@simardwt/winding-tree-utils";
import { GeoJsonPoint } from "../../types/shared/GeoJsonPoint";
import { DerbysoftContentServiceFactory, EmailElement } from "./DerbysoftContentService";
import { DerbysoftContentService, HotelInfoMap } from "./types/ContentApi";
import {
  Amenity,
  CheckInOutPolicy,
  MediaItem,
  MediaType,
  RoomSize,
  UnitType,
} from "@simardwt/winding-tree-types";
import {
  GuestRoom,
  HotelDescriptiveContent,
  ContactInfo1,
} from "@simardwt/ota-types/dist/derbysoft";
import { coerceArray, strToInt } from "../../utils/generalUtils";
import { EAddress } from "../../database/models/EAddress";
import { CountryName, StateProv } from "@simardwt/ota-types";
import { getHotelIdFromAccommodationId } from "../../utils/accommodation";
import { DerbysoftHotelsStorageService } from "./DerbysoftHotelsStorageService";
import { SessionContext } from "../../types/shared/SessionContext";
import { SortOrder } from "../hotel/HotelsStorageService";
import { KeyValuePairs } from "../../types";
import { Suppliers, TSupplierId, getSupplierById } from "../../types/shared/Suppliers";
import { waitFor } from "../../utils/generalUtils";
import { amenitiesMap } from "./ota/ota-code-type/amenitites";
import { UnitsOfMeasureCode } from "./ota/ota-code-type/unitsOfMeasure";
import { getHotelsValidation } from "../../validation";

@Service({ global: true })
export class DerbysoftHotelsService extends BaseHotelsService<EDerbysoftHotel> {
  private log = getLogger(__filename);

  private _distributorId: string;
  private _bookingAccessToken: string;
  private _bookingBaseURL: string;
  private _shoppingAccessToken: string;
  private _shoppingBaseURL: string;
  private _derbysoftSupplierClient: DerbysoftSupplierClient;
  private _supplierIds: TSupplierId[];
  private _derbysoftContentService: DerbysoftContentService;
  private _ready: Promise<boolean>;
  private _isUAT: boolean;
  private _suppliers: Suppliers;

  constructor(useEnvConfig = true) {
    super("DERBYSOFT");
    this.hotelsStorageService = Container.get(DerbysoftHotelsStorageService);
    this._ready = this.initialize(useEnvConfig);
    this._derbysoftSupplierClient = new DerbysoftSupplierClient(
      this.distributorId,
      this._bookingAccessToken,
      this.bookingBaseURL,
      this._shoppingAccessToken,
      this.shoppingBaseURL
    );
  }

  private async initialize(useEnvConfig: boolean) {
    // populate config values from config source (.env OR httpService)
    const configService = new ConfigService(useEnvConfig);
    const config = configService.getConfig("derbysoft");
    this._distributorId = config["distributorId"];
    this._shoppingAccessToken = config["shoppingAccessToken"];
    this._bookingAccessToken = config["bookingAccessToken"];
    this._bookingBaseURL = config["bookingBaseURL"];
    this._shoppingBaseURL = config["shoppingBaseURL"];
    this._supplierIds = config["supplierIds"];
    this._suppliers = config["suppliers"];
    this._isUAT = (configService.getConfig() as Config).isUAT;
    this._derbysoftContentService = await DerbysoftContentServiceFactory.getService();
    return true;
  }

  public get derbysoftSupplierClient(): DerbysoftSupplierClient {
    return this._derbysoftSupplierClient;
  }

  public get derbysoftContentService(): DerbysoftContentService {
    return this._derbysoftContentService;
  }

  public get distributorId(): string {
    return this._distributorId;
  }

  public get shoppingAccessToken(): string {
    return this._shoppingAccessToken;
  }

  public get bookingAccessToken(): string {
    return this._bookingAccessToken;
  }

  public get shoppingBaseURL(): string {
    return this._shoppingBaseURL;
  }

  public get bookingBaseURL(): string {
    return this._bookingBaseURL;
  }

  public get supplierIds(): TSupplierId[] {
    return this._supplierIds;
  }

  public get suppliers(): Suppliers {
    return this._suppliers;
  }

  public get isUAT(): boolean {
    return this._isUAT;
  }

  public setupHotelsInDerbysoft() {
    // TODO: setup derbysoft hotels by supplier
  }

  public async getAllHotelsFromDerbysoft(supplierId: string) {
    await this._ready;

    // get all hotels by supplier from derbysoft
    const hotelsList = await this.derbysoftSupplierClient.listHotels(supplierId);

    // get corresponding hotel details in parallel
    const hotelsListDetails = hotelsList.map((hotel) => {
      return this.derbysoftSupplierClient.listHotelProducts(supplierId, hotel.hotelId);
    });

    // fetch hotel metadata from content API
    const hotelCodeContext = getSupplierById(this.suppliers, supplierId)?.hotelCodeContext;
    const hotelIds = hotelsList.map((hotel) => hotel.hotelId);

    // TO-DO: optionally filter hotelIds to include only recently modified hotels
    const hotelsInfo = this.derbysoftContentService.getHotelsInfo(hotelCodeContext, hotelIds);

    return Promise.all([Promise.all(hotelsListDetails), hotelsInfo]);
  }

  public getAllHotelsByContext(
    context: SessionContext,
    filterCriteria?: { [key: string]: unknown },
    sortOrder?: SortOrder<EDerbysoftHotel>
  ): Promise<EDerbysoftHotel[]> {
    return this.getAllHotels(
      context,
      { ...filterCriteria, "customData.supplierId": context.supplierId },
      sortOrder
    );
  }

  public async syncHotels(): Promise<number> {
    // TO-DO: we need to get a list of available suppliers from a more dynamic source than env
    let totalHotelsUpdated = 0;

    const hotelSyncFunc = async (supplierId: TSupplierId) => {
      // pull all hotels from derbysoft and upsert into DB collection
      this.log.info(`Syncing hotels from ${supplierId}...`);
      const [derbysoftHotels, derbysoftHotelsInfo] = await this.getAllHotelsFromDerbysoft(
        supplierId
      );

      const mergedHotelsInfo = this.mergeHotelsDetailsWithContent(
        derbysoftHotels,
        derbysoftHotelsInfo
      );

      // transform records to match DB model and insert
      const matchFields = ["providerId", "providerHotelId", "customData.supplierId"];

      const savedHotels = await this.hotelsStorageService.storeHotels(
        mergedHotelsInfo,
        matchFields,
        this.convertHotelToEntity.bind(this)
      );

      const syncErrors = savedHotels.some((promise) => {
        return promise.status === "rejected";
      });

      if (syncErrors) {
        const failedUpdates = savedHotels.flatMap((promise) => {
          if (promise.status === "rejected") {
            return [(promise.reason as Error)?.message];
          }
          return [];
        });

        this.log.error(
          `The following error(s) occurred when updating hotels from ${supplierId}`,
          failedUpdates
        );
        throw new HotelOTAError(
          `The following error(s) occurred when updating hotels from ${supplierId}`,
          undefined,
          failedUpdates
        );
      }

      // for UAT environment we modify coordinates of hotels to allow targeted searches
      if (this.isUAT) {
        await this.updateHotelCoordinates("DERBYSOFT", supplierId);
      }

      this.log.info(`${supplierId} - Hotels sync complete (${savedHotels.length} hotels)`);
      totalHotelsUpdated += savedHotels.length;
      return savedHotels.length;
    };

    const hotelsUpdatePromiseArray = [];
    for (let idx = 0; idx < this.supplierIds.length; idx++) {
      const supplierId = this.supplierIds[idx];
      await waitFor(4000);
      const hotelsUpdated = hotelSyncFunc(supplierId).catch((err: unknown) => {
        this.log.error(`${supplierId} - Sync failed - ${(err as Error).message}`);
      });

      hotelsUpdatePromiseArray.push(hotelsUpdated);
    }

    await Promise.allSettled(hotelsUpdatePromiseArray);

    return totalHotelsUpdated;
  }

  private async updateHotelCoordinates(providerId: string, supplierId: TSupplierId) {
    // get hotels ordered by hotelId
    const hotels = await this.getAllHotels(
      undefined,
      { providerId, "customData.supplierId": supplierId },
      {
        providerHotelId: 1,
      }
    );

    // for each hotel update longitude incrementally
    const baseHotelCoordinates = { lon: 13.404954, lat: 52.520008 }; // force to Berlin
    for (let i = 0; i < hotels.length; i++) {
      const hotel = hotels[i];
      // hotel.location.coordinates[0] = hotel.location.coordinates[0] + i * 3;
      hotel.location.coordinates[0] = baseHotelCoordinates.lon + i * 0.03;
      hotel.location.coordinates[1] = baseHotelCoordinates.lat;
      await this.hotelsStorageService.saveHotel(hotel);
    }
  }

  public async findHotelByAccommodationId(
    accommodationId: string,
    context: SessionContext
  ): Promise<EDerbysoftHotel> {
    const hotelId = getHotelIdFromAccommodationId(accommodationId, context.supplierId);

    return this.findHotelById(hotelId, context);
  }

  public async findHotelsByAccommodationIds(
    accommodationIds: string[],
    context: SessionContext
  ): Promise<EDerbysoftHotel[]> {
    // validate accommodationIds
    getHotelsValidation({ accommodationIds });

    // decode accommodationIds
    const hotelIds = accommodationIds.map((accommodationId) =>
      getHotelIdFromAccommodationId(accommodationId, context.supplierId)
    );

    const hotels = await this.findHotelsByIds(hotelIds, context);
    return hotels;
  }

  public async findHotelById(hotelId: string, context: SessionContext): Promise<EDerbysoftHotel> {
    const hotel = await this.hotelsStorageService.getAllHotels({
      providerId: this.providerId,
      providerHotelId: hotelId,
      "customData.supplierId": context.supplierId,
    });

    return hotel[0] as EDerbysoftHotel;
  }

  public async findHotelsByIds(
    hotelIds: string[],
    context: SessionContext
  ): Promise<EDerbysoftHotel[]> {
    const hotel = await this.hotelsStorageService.getAllHotels({
      providerId: this.providerId,
      providerHotelId: {
        $in: hotelIds,
      },
      "customData.supplierId": context.supplierId,
    });

    return hotel as EDerbysoftHotel[];
  }

  protected buildFilterCriteriaFromSearchContext(context: SessionContext): KeyValuePairs {
    return {
      "customData.supplierId": context.supplierId,
    };
  }

  protected convertHotelToEntity(hotel: BookingUsbEnhancedHotelProductsResponse): EDerbysoftHotel {
    const location = this.getLocation(hotel);
    const hotelName = this.getHotelName(hotel);
    const derbysoftHotel = new EDerbysoftHotel({
      ariType: hotel.ariType,
      location,
      providerHotelId: hotel.hotelId,
      providerId: this.providerId,
      rateType: hotel.rateType,
      status: hotel.status,
      supplierId: hotel.supplierId,
      timezone: hotel.timezone,
      hotelName,
      maxChildAge: hotel.maxChildAge,
    });

    derbysoftHotel.roomTypes = this.getHotelRoomTypes(hotel);
    derbysoftHotel.phones = this.getHotelPhones(hotel);
    derbysoftHotel.emails = this.getHotelEmails(hotel);
    derbysoftHotel.rating = this.getHotelRating(hotel);

    derbysoftHotel.addresses = this.getHotelAddresses(hotel);
    derbysoftHotel.description = this.getHotelDescription(hotel);

    derbysoftHotel.checkInOutPolicy = this.getCheckInOutPolicy(hotel);

    derbysoftHotel.customData.media = this.getMedia(hotel.content);
    derbysoftHotel.customData.brandCode = hotel.brandCode;
    derbysoftHotel.customData.chainCode = hotel.chainCode;
    derbysoftHotel.customData.childRateType = hotel.childRateType;
    derbysoftHotel.customData.settings = hotel.settings;

    return derbysoftHotel;
  }

  private getLocation(hotel: BookingUsbEnhancedHotelProductsResponse): GeoJsonPoint {
    // check for location from via Go suite or fallback to Content suite metadata
    const longitude = hotel.longitude ?? hotel?.content?.HotelInfo?.Position?.attributes?.Longitude;
    const latitude = hotel.latitude ?? hotel?.content?.HotelInfo?.Position?.attributes?.Latitude;

    return new GeoJsonPoint([parseFloat(longitude), parseFloat(latitude)]);
  }

  private getHotelName(hotel: BookingUsbEnhancedHotelProductsResponse): string {
    const hotelName = hotel.hotelName ?? hotel?.content?.HotelInfo?.HotelName;
    return hotelName;
  }

  private getHotelRoomTypes(hotel: BookingUsbEnhancedHotelProductsResponse): ERoomType[] {
    const guestRooms = coerceArray(hotel?.content?.FacilityInfo?.GuestRooms?.GuestRoom);
    const roomProductsMap: { [ID: string]: number } = hotel.products?.reduce(
      (idMap, room, index) => {
        idMap[room.roomId] = index;
        return idMap;
      },
      {}
    );

    const guestRoomsMap: { [ID: string]: number } = guestRooms?.reduce((idMap, room, index) => {
      idMap[room.attributes.ID] = index;
      return idMap;
    }, {});

    const roomProductWithoutContent = hotel.products?.filter(
      (product) => !guestRoomsMap[product.roomId]
    );

    const roomTypesWithContent: ERoomType[] = guestRooms.map((room): ERoomType => {
      const roomType = new ERoomType();

      // const roomProductIndex = roomProductsMap[room.attributes.ID];
      // NOTE: some hotels (e.g PREMIER INN) roomID from Content API do not match roomID in GO
      // the mapping will not correspond/work in such cases

      const roomId = room.attributes.ID;
      const roomIndex = roomProductsMap[roomId];
      const roomProduct = hotel.products?.[roomIndex];

      roomType.name = roomProduct?.roomName ?? room?.attributes?.RoomTypeName;
      roomType.description = room?.DescriptiveText ?? roomProduct?.roomDescription;
      const adults = room?.attributes.MaxAdultOccupancy
        ? parseInt(room.attributes.MaxAdultOccupancy, 10)
        : roomProduct?.occupancy?.maxAdult;

      // only max children when max adults is defined
      const children = adults
        ? room?.attributes.MaxChildOccupancy
          ? parseInt(room.attributes.MaxChildOccupancy, 10)
          : roomProduct?.occupancy?.maxChild
        : undefined;

      // some suppliers only provide this field
      const maxOccupancy = parseInt(room?.attributes.MaxOccupancy);

      roomType.maximumOccupancy = {
        adults: adults ?? maxOccupancy,
        children,
      };

      // Add custom data
      const customData: EDerbysoftRoomTypeCustomData = {
        roomId: roomId,
        rateId: roomProduct?.rateId,
        rateName: roomProduct?.rateName,
        rateDescription: roomProduct?.rateDescription,
        roomName: roomProduct?.roomName ?? room?.attributes?.RoomTypeName,
        hasNoProduct: !roomProduct,
      };

      roomType.customData = customData;

      // TO-DO: Handle cancelPolicy penalties
      roomType.policies = this.getRoomPolicies(roomProduct);

      const unit = this.getHotelAreaUnitOfMeasure(hotel);
      roomType.size = this.getRoomSize(room, unit);
      roomType.amenities = this.getRoomAmenities(room);
      roomType.media = this.getMedia(room);

      return roomType;
    });

    const roomTypesWithoutContent: ERoomType[] = roomProductWithoutContent?.map(
      (roomProduct): ERoomType => {
        const roomType = new ERoomType();

        // const roomProductIndex = roomProductsMap[room.attributes.ID];
        // NOTE: some hotels (e.g PREMIER INN) roomID from Content API do not match roomID in GO
        // the mapping will not correspond/work in such cases

        const roomId = roomProduct.roomId;

        roomType.name = roomProduct.roomName ?? roomProduct.roomId;
        roomType.description = roomProduct.roomDescription;
        roomType.maximumOccupancy = {
          adults: roomProduct.occupancy?.maxAdult,
          children: roomProduct.occupancy?.maxChild,
        };

        // Add custom data
        const customData: EDerbysoftRoomTypeCustomData = {
          roomId: roomId,
          rateId: roomProduct.rateId,
          rateName: roomProduct.rateName,
          rateDescription: roomProduct.rateDescription,
          roomName: roomProduct.roomName,
          hasNoContent: true,
        };

        roomType.customData = customData;

        // TO-DO: Handle cancelPolicy penalties
        roomType.policies = this.getRoomPolicies(roomProduct);

        return roomType;
      }
    );

    return [...(roomTypesWithContent ?? []), ...(roomTypesWithoutContent ?? [])];
  }

  private getHotelPhones(hotel: BookingUsbEnhancedHotelProductsResponse): EPhone[] {
    // return [new EPhone(hotel.phone)];
    const contactInfo = hotel.content.ContactInfos?.ContactInfo;
    return Array.isArray(contactInfo)
      ? contactInfo.reduce((allPhones, info) => {
          const phones = coerceArray(info?.Phones?.Phone)?.map(({ attributes }) => {
            return new EPhone({
              areaCityCode: attributes?.AreaCityCode,
              countryAccessCode: attributes?.CountryAccessCode,
              phoneNumber: attributes?.PhoneNumber,
            });
          });
          allPhones.push(...phones);
          return allPhones;
        }, [])
      : coerceArray((contactInfo as ContactInfo1)?.Phones?.Phone)?.map(({ attributes }) => {
          return new EPhone({
            areaCityCode: attributes?.AreaCityCode,
            countryAccessCode: attributes?.CountryAccessCode,
            phoneNumber: attributes?.PhoneNumber,
          });
        });
  }

  private getHotelAddresses(hotel: BookingUsbEnhancedHotelProductsResponse): EAddress[] {
    const contactInfos = coerceArray(hotel?.content?.ContactInfos?.ContactInfo);
    const contactAddresses = contactInfos?.length
      ? coerceArray(contactInfos[0]?.Addresses?.Address)
      : undefined;
    if (contactAddresses?.length) {
      return contactAddresses
        ?.filter((addr) => addr)
        ?.map((contactAd) => {
          const contactAddress = coerceArray(contactAd);

          // Very hacky :(
          const countryName = contactAddress[0]?.CountryName as unknown as CountryName;
          const stateProv = contactAddress[0]?.StateProv as unknown as StateProv;

          return {
            addressLine: coerceArray(contactAddress[0]?.AddressLine),
            country: countryName?.$value || countryName?.attributes.Code,
            city: contactAddress[0]?.CityName,
            state: stateProv?.$value || stateProv?.attributes?.StateCode,
            postalCode: contactAddress[0]?.PostalCode,
            premise: `${contactAddress[0]?.BldgRoom ? `${contactAddress[0]?.BldgRoom}, ` : ""}${
              contactAddress[0]?.StreetNmbr ?? ""
            }`,
          };
        });
    } else {
      return [
        {
          addressLine: coerceArray(hotel.address),
          country: hotel.country,
          city: hotel.city,
          state: hotel.state,
        },
      ];
    }
  }

  private getHotelAreaUnitOfMeasure(
    hotel: BookingUsbEnhancedHotelProductsResponse
  ): UnitType | undefined {
    const unitCode = hotel.content?.attributes.AreaUnitOfMeasureCode as UnitsOfMeasureCode;
    if (["1", "6", "7", "8", "13", "17", "18"].includes(unitCode)) {
      return UnitType.imperial;
    } else if (["14", "20", "21", "28", "2", "3", "4", "5"].includes(unitCode)) {
      return UnitType.metric;
    }
    return undefined;
  }

  private getHotelEmails(hotel: BookingUsbEnhancedHotelProductsResponse): string[] {
    // return [new EPhone(hotel.phone)];
    const contactInfo = hotel?.content?.ContactInfos?.ContactInfo;
    return Array.isArray(contactInfo)
      ? contactInfo.reduce((allEmails, info) => {
          const emails = this.extractMails(info?.Emails?.Email);
          allEmails.push(...emails);
          return allEmails;
        }, [])
      : this.extractMails((contactInfo as ContactInfo1).Emails?.Email);
  }

  private extractMails(emails: string[] | EmailElement[] | string): string[] {
    const normalizedEmails = coerceArray<string | EmailElement>(emails);

    return normalizedEmails?.map((item) => {
      if (typeof item === "string") {
        return item;
      } else {
        return (item as EmailElement).$value;
      }
    });
  }

  private getMedia(item: GuestRoom | HotelDescriptiveContent): MediaItem[] | undefined {
    const mediaItems: MediaItem[] = coerceArray(
      item?.MultimediaDescriptions?.MultimediaDescription
    )?.reduce((allMedia: MediaItem[], media): MediaItem[] => {
      coerceArray(media.ImageItems?.ImageItem)?.forEach((imageItem) => {
        const height = coerceArray(imageItem?.ImageFormat)?.reduce((maxHeight, img) => {
          const currentHeight = parseInt(img?.attributes?.Height, 10);
          return maxHeight > currentHeight ? maxHeight : currentHeight;
        }, 0);

        const width = coerceArray(imageItem?.ImageFormat)?.reduce((maxWidth, img) => {
          const currentHeight = parseInt(img?.attributes?.Height, 10);
          return maxWidth > currentHeight ? maxWidth : currentHeight;
        }, 0);

        allMedia.push({
          type: MediaType.photo,
          height,
          width,
          url: coerceArray(imageItem?.ImageFormat)?.reduce(
            (finalUrl, currentImage) => currentImage.URL,
            ""
          ),
        });
      });

      coerceArray(media.VideoItems?.VideoItem)?.forEach((videoItem) => {
        allMedia.push({
          type: MediaType.video,
          height: 0, // placeholders to pass typescript parser
          width: 0,
          url: coerceArray(videoItem?.VideoFormat)?.reduce(
            (finalUrl, currentVideo) => currentVideo.URL,
            ""
          ),
        });
      });

      return allMedia;
    }, []);

    if (mediaItems?.length) {
      return mediaItems;
    }

    return undefined;
  }

  private getRoomAmenities(room: GuestRoom): Amenity[] {
    const amenities = room?.Amenities?.Amenity;

    // force amenity to an array or undefined
    const normalizedAmenity = Array.isArray(amenities)
      ? amenities
      : amenities
      ? [amenities]
      : undefined;
    return normalizedAmenity?.map((amenity) => {
      const otaCode = amenity?.attributes.RoomAmenityCode;

      return {
        name: otaCode ? amenitiesMap[otaCode] : null,
        description: amenity?.DescriptiveText ?? amenity?.attributes?.CodeDetail,
        otaCode,
      };
    });
  }

  private getRoomSize(product: GuestRoom, unit: UnitType): RoomSize {
    const typeRoom = product?.TypeRoom;
    if (!typeRoom) return undefined;
    const typeRoomArray = coerceArray(typeRoom);

    return typeRoomArray.reduce((maxRoomSize: RoomSize, room): RoomSize | undefined => {
      // return the largest size for now
      if (maxRoomSize) {
        const size =
          room.attributes.Size > (maxRoomSize?.value ?? 0)
            ? room.attributes.Size
            : maxRoomSize.value;

        return {
          value: size,
          unit, // TO-DO: determine actual unit type for hotel
        };
      }

      return undefined;
    }, undefined);
  }

  private getRoomPolicies(room: HotelProduct): Map<string, string> {
    // TO-DO: modify to get other policies e.g pet policy from content
    const cancelPolicies = coerceArray(room?.cancelPolicies)?.reduce((policyMap, policy) => {
      policyMap.set(policy.cancelPolicy.code, policy.cancelPolicy.description);
      return policyMap;
    }, new Map<string, string>());

    return cancelPolicies;
  }

  private getHotelRating(hotel: BookingUsbEnhancedHotelProductsResponse): number | undefined {
    // TO-DO - How do we determine rating, using max rating for now
    const rating = coerceArray(hotel?.content?.AffiliationInfo?.Awards?.Award)?.reduce(
      (maxRating, award): number | undefined => {
        const currentRating = strToInt(award?.attributes?.Rating, -1);
        maxRating = currentRating > maxRating ? currentRating : maxRating;
        return maxRating;
      },
      -1
    );

    return rating <= 0 ? undefined : rating;
  }

  private getHotelDescription(hotel: BookingUsbEnhancedHotelProductsResponse): string {
    return hotel?.content?.HotelInfo?.Descriptions?.DescriptiveText;
  }

  private getCheckInOutPolicy(hotel: BookingUsbEnhancedHotelProductsResponse): CheckInOutPolicy {
    let checkInOutPolicy;
    coerceArray(hotel?.content?.Policies?.Policy)?.find((policy) => {
      const foundPolicyInfo = coerceArray(policy.PolicyInfo).find((policyInfo) => {
        if (policyInfo.attributes) {
          const { CheckInTime: checkinTime, CheckOutTime: checkoutTime } = policyInfo.attributes;

          if (checkinTime && checkoutTime) return true;
        }

        return false;
      });

      if (foundPolicyInfo) {
        const { CheckInTime: checkinTime, CheckOutTime: checkoutTime } = foundPolicyInfo.attributes;

        checkInOutPolicy = { checkoutTime, checkinTime };
      }

      return undefined;
    });

    return checkInOutPolicy;
  }

  protected mergeHotelsDetailsWithContent(
    hotelsDetails: BookingUsbHotelProductsResponse[],
    hotelsInfo: HotelInfoMap
  ): BookingUsbEnhancedHotelProductsResponse[] {
    return (
      hotelsDetails
        .map((hotel) => {
          const content: HotelDescriptiveContent = hotelsInfo[hotel.hotelId];
          const enhancedHotel: BookingUsbEnhancedHotelProductsResponse = {
            ...hotel,
            content,
          };
          return enhancedHotel;
        })
        // skip hotels that have no content
        .filter((hotel) => !!hotel.content)
    );
  }
}
