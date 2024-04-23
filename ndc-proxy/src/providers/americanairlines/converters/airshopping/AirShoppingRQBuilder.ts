import {FarelogixConfiguration} from '../../../../env';
import {v4} from 'uuid';
import {NDCItineraryCriteria, NDCPassenger} from '../../../../interfaces/ndc';
import {passengerListRQBuilder} from '../utils/passengerListRQBuilder';
import {buildSpecialFareQualifiersXML} from '../utils/buildSpecialFareQualifiersXML';
import {BaseGliderException, ErrorCodes, HttpStatusCode} from '../../../../api/errors';
import {ExtendedSessionContext} from '../../../../services/ExtendedSessionContext';

export const generateTransactionID = () => {
    let id = v4();
    id = id.replace(/-/ig, '');
    return id;
};

// this part of the request is required by UA in case DBF are requested (e.g. B99)
export const buildDBFServiceFilter = (config: ExtendedSessionContext): string => {
    // only populate below request fragment if DBF is enabled and bundle IDs are configured
    if (config.isDBFEnabled && Array.isArray(config.serviceFilters) && config.serviceFilters.length > 0) {
        const serviceFilters = config.serviceFilters.map(value => {
            const pair = value.split(':');
            if (pair.length !== 2) {
                throw new BaseGliderException(HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR, 'Invalid service filter configuration', ErrorCodes.UNKNOWN_ERROR);
            }
            return `<ServiceFilter>
                <GroupCode>${pair[0]}</GroupCode>
                <SubGroupCode>${pair[1]}</SubGroupCode>
            </ServiceFilter>`;
        }).join('');
        return `<ServiceFilters>
                    ${serviceFilters}
                </ServiceFilters>`;
    }
    return '';
};

function addTourCode(config: FarelogixConfiguration): string {
    if (config.tourCode && config.tourCode.length > 0) {
        return `<AugmentationPoint>
                                <AugPoint>
                                    <TourCode xmlns="http://ndc.farelogix.com/aug">${config.tourCode}</TourCode>
                                </AugPoint>
                            </AugmentationPoint>`;
    } else { return ''; }
}

export function buildAirShoppingRQ(config: ExtendedSessionContext, passengers: NDCPassenger[], itineraries: NDCItineraryCriteria[], transactionID: string): string {
    const cabinPreferences: string[] = config.cabinPreferences.length > 0 ? config.cabinPreferences : [];
    return `<AirShoppingRQ Version="17.2" TransactionIdentifier="${transactionID}">
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
                    ${buildDBFServiceFilter(config)}
                    <Pricing>
                        <OverrideCurrency>${config.currencyCode}</OverrideCurrency>
                    </Pricing>
                </Parameters>
                <CoreQuery>
                    <OriginDestinations>
                        ${itineraries.map(itinerary => {
        return `<OriginDestination OriginDestinationKey="${itinerary.odKey}">
                            <Departure>
                                <AirportCode>${itinerary.origin}</AirportCode>
                                <Date>${itinerary.travelDate}</Date>
                            </Departure>
                            <Arrival>
                                <AirportCode>${itinerary.destination}</AirportCode>
                            </Arrival>
                        </OriginDestination>`;
    }).join('\n')}
                    </OriginDestinations>
                </CoreQuery>
                <Qualifier>
                    ${buildSpecialFareQualifiersXML(config)}
                </Qualifier>
                <Preference>
                    ${config.serviceFilters.length > 0 ? `<ServicePricingOnlyPreference>
                        <ServicePricingOnlyInd>true</ServicePricingOnlyInd>
                    </ServicePricingOnlyPreference>` : ``}
                    ${cabinPreferences.length > 0 ? `<CabinPreferences>
                            ${cabinPreferences.map(cabin => `<CabinType><Code>${cabin}</Code></CabinType>`).join('')}
                    </CabinPreferences>` : ``}
                </Preference>
            <DataLists>
               ${passengerListRQBuilder(config, passengers, true, true, true, false)}
            </DataLists>
            <Metadata>
                <Other>
                    <OtherMetadata>
                        <RuleMetadatas>
                            <RuleMetadata MetadataKey="KEY">
                                ${addTourCode(config)}
                                <RuleID>RULEID</RuleID>
                            </RuleMetadata>
                        </RuleMetadatas>
                    </OtherMetadata>
                </Other>
            </Metadata>
            </AirShoppingRQ>`;
}
