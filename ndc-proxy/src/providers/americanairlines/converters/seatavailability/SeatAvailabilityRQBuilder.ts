import {FarelogixConfiguration} from '../../../../env';
import {NDCOffer, NDCPassenger} from '../../../../interfaces/ndc';
import {passengerListRQBuilder} from '../utils/passengerListRQBuilder';
// @ts-ignore
import {buildSpecialFareQualifiersXML} from '../utils/buildSpecialFareQualifiersXML';
// import {buildSpecialFareQualifiersXML} from '../utils/buildSpecialFareQualifiersXML';

export function buildSeatAvailabilityRQ(config: FarelogixConfiguration, passengers: NDCPassenger[], offer: NDCOffer, segmentRefs: string[], responseId: string, transactionID: string): string {
    // const itineraries = searchCriteria.itineraries;
    return `<SeatAvailabilityRQ Version="17.2" TransactionIdentifier="${transactionID}">
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
                ${segmentRefs.map(segment => `<SegmentID>${segment}</SegmentID>`).join('')}
               </Offer>
            </Query>
            <DataLists>
                ${passengerListRQBuilder(config, passengers, false, true, true, true)}
            </DataLists>
            </SeatAvailabilityRQ>`;
}
