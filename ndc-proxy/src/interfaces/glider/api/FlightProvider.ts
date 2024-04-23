import {PassengerSearchCriteria, SearchResults} from '../common';
import {FlightSearchCriteria} from '../air';

export abstract class FlightProvider {
  public abstract flightSearch(itinerary: FlightSearchCriteria, passengers: PassengerSearchCriteria[]): Promise<SearchResults>;
  public abstract retrieveSeatmaps(offers: any): Promise<any>;
  public abstract priceOffers(body: any, offers: any): Promise<any>;
  public abstract orderCreate(offer: any, requestBody: any, guaranteeClaim: any): Promise<any>;
  public abstract orderFulfill(orderId: string, order: any, body: any, guaranteeClaim: any): Promise<any>;
  public abstract getProviderID(): string;
}
