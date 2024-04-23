import {FarelogixConfiguration} from '../../../../env';
import {NDCOffer, NDCPassenger} from '../../../../interfaces/ndc';
import {passengerListRQBuilder} from '../utils/passengerListRQBuilder';
import {buildSpecialFareQualifiersXML} from '../utils/buildSpecialFareQualifiersXML';

export function buildOfferPriceRQ(config: FarelogixConfiguration, passengers: NDCPassenger[], offer: NDCOffer, responseId: string, transactionID: string): string {
    // const itineraries = searchCriteria.itineraries;
    return `<OfferPriceRQ Version="17.2" TransactionIdentifier="${transactionID}">
                <PointOfSale>
                    <Location>
                        <CountryCode>${config.pointOfSaleCountry}</CountryCode>
                        <CityCode>${config.pointOfSaleCity}</CityCode>
                    </Location>
                </PointOfSale>
                <Document id="document" >
                </Document>
                <Party>
                    <Sender>
                        <TravelAgencySender>
                            <PseudoCity>${config.agencyPCC}</PseudoCity>
                            <AgencyID>${config.agencyIATA}</AgencyID>
                        </TravelAgencySender>
                    </Sender>
                   <Participants>
                        <Participant>
                            <CorporateParticipant>
                                <Name>${config.corporateParticipantName}</Name>
                                <ID>${config.corporateParticipantID}</ID>
                            </CorporateParticipant>
                        </Participant>
                    </Participants>
                </Party>
            <Parameters>
                <Pricing >
                    <OverrideCurrency>${config.currencyCode}</OverrideCurrency>
                </Pricing>
            </Parameters>
             <Query>
               <Offer OfferID="${offer.OfferID}" Owner="${offer.Owner}" ResponseID="${responseId}">
                ${offer.OfferItems.map(offerItem => {
        return `<OfferItem OfferItemID="${offerItem.OfferItemID}">
                        <PassengerRefs>${offerItem.Service.PassengerRefs}</PassengerRefs>
                    </OfferItem>`;
    }).join('\n')}
               </Offer>
            </Query>
            <Preference>
               <FarePreferences>
                  <Types>
                     <!--70J - Published Fares only; 749 - Negotiated Fares only; both 70J and 749 - Published and Negotiated Fares-->
                     <Type>70J</Type>
                     <Type>749</Type>
                  </Types>
                  <Exclusion>
                     <NoMinStayInd>false</NoMinStayInd>
                     <NoMaxStayInd>false</NoMaxStayInd>
                     <NoAdvPurchaseInd>false</NoAdvPurchaseInd>
                     <NoPenaltyInd>false</NoPenaltyInd>
                  </Exclusion>
               </FarePreferences>
               <!--best price Y/N-->
               <PricingMethodPreference>
                  <BestPricingOption>N</BestPricingOption>
               </PricingMethodPreference>
               <!--price services only or itinerary only true/false-->
               <!--<ServicePricingOnlyPreference>
                  <ServicePricingOnlyInd>false</ServicePricingOnlyInd>
               </ServicePricingOnlyPreference>-->
            </Preference>
            <Qualifier>
                ${buildSpecialFareQualifiersXML(config)}
            </Qualifier>
            <DataLists>
                ${passengerListRQBuilder(config, passengers, false, false, true, false)}
            </DataLists>
            </OfferPriceRQ>`;
}
