import {FarelogixConfiguration} from '../../../../env';
import {NDCOffer, NDCOfferItem, NDCPassenger, NDCPaymentDetails, NDCSeatSelection} from '../../../../interfaces/ndc';
import {passengerListRQBuilderOrderCreate} from '../utils/passengerListRQBuilder';

export function OrderCreateRQBuilder(config: FarelogixConfiguration, passengers: NDCPassenger[], offer: NDCOffer, payment: NDCPaymentDetails, transactionID: string, ndcSeatSelectionOffer: NDCOffer= undefined): string {
    // const itineraries = searchCriteria.itineraries;
    console.log(`OrderCreateRQ, transactionID:${transactionID}`);
    return `<OrderCreateRQ Version="17.2" TransactionIdentifier="${transactionID}">
    <PointOfSale>
        <Location>
            <CountryCode>${config.pointOfSaleCountry}</CountryCode>
            <CityCode>${config.pointOfSaleCity}</CityCode>
        </Location>
        <TouchPoint>
            <Device>
                <Code>5</Code>
                <Definition>54.45.45.45</Definition>
            </Device>
        </TouchPoint>
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
    <Query>
        <Order>
            ${createOfferElement(offer)}
            ${ndcSeatSelectionOffer ? createOfferElement(ndcSeatSelectionOffer) : ''}
        </Order>
        <Payments>
            <Payment>
                <Type>${payment.type}</Type>
                <Method>
                    <PaymentCard>
                        <CardCode>${payment.card.cardCode}</CardCode>
                        <CardNumber>${payment.card.cardNumber}</CardNumber>
                        <SeriesCode>${payment.card.cardSeriesCode}</SeriesCode>
                        <CardHolderName>${payment.card.cardHolderName}</CardHolderName>
                        <CardHolderBillingAddress>
                            <Street>${payment.card.billingAddressStreet}</Street>
                            <CityName>${payment.card.billingAddressCity}</CityName>
                            <StateProv>${payment.card.billingAddressState}</StateProv>
                            <PostalCode>${payment.card.billingAddressPostal}</PostalCode>
                            <CountryCode>${payment.card.billingAddressCountryCode}</CountryCode>
                        </CardHolderBillingAddress>
                        <EffectiveExpireDate>
                            <Expiration>${payment.card.cardExpiryDate}</Expiration>
                        </EffectiveExpireDate>
                    </PaymentCard>
                </Method>
                <Amount Code="${payment.currencyCode}">0.00</Amount>
            </Payment>
        </Payments>
        <DataLists>
            ${passengerListRQBuilderOrderCreate(config, passengers, true, true, true)}
        </DataLists>
        ${createSSRs(config, passengers)}
    </Query>
</OrderCreateRQ>`;
}

function createSSRs(config: FarelogixConfiguration, passengers: NDCPassenger[]): string {
    return `
    <Metadata>
        ${config.airlineCode === 'UA' ? createUASpecific(config, passengers) : ''}
    </Metadata>`;
}

// @ts-ignore
function createUASpecific(config: FarelogixConfiguration, passengers: NDCPassenger[]): string {
    let ssrIdx = 1;
    return `
    ${passengers.map(passenger => {
        return `<PassengerMetadata MetadataKey="SSR${ssrIdx++}">
            <AugmentationPoint>
                <AugPoint> <!--If ActionCode is NN then this SSR will be added to the OrderViewRS If ActionCode is XX or anything else then this SSR will not be added to the OrderViewRS If no value for ActionCode is provided then this SSR will also be added to the OrderViewRS Note: the same apply using lowercase-->
                    <SpecialServiceRequest xmlns="http://ndc.farelogix.com/aug">
                        <TravelerIDRef>${passenger.PassengerID}</TravelerIDRef>
                        <AirlineCode>UA</AirlineCode>
                        <SSRCode>UCID</SSRCode>
                        <Text>UCIDd67fcde9-e72f-4ed3-a699-47446d180827</Text>
                        <NumberInParty>1</NumberInParty>
                    </SpecialServiceRequest>
                </AugPoint>
            </AugmentationPoint>
        </PassengerMetadata>`;
    }).join('\n')}`;
}

function createOfferElement(offer: NDCOffer): string {
    if (!Array.isArray(offer.OfferItems) || offer.OfferItems.length === 0) {
        return '';
    }
    return `<Offer OfferID="${offer.OfferID}" Owner="${offer.Owner}" ResponseID="${offer.ResponseID}">
        ${offer.OfferItems.map(offerItem => {
            return createOfferItemElement(offerItem); }).join('\n')}
        </Offer>`;
}

function createOfferItemElement(offerItem: NDCOfferItem): string {
    return `
    <OfferItem OfferItemID="${offerItem.OfferItemID}">
        ${offerItem.Service && offerItem.Service.PassengerRefs ? `<PassengerRefs>${offerItem.Service.PassengerRefs}</PassengerRefs>` : ``}
        ${offerItem.PassengerRefs ? `<PassengerRefs>${offerItem.PassengerRefs}</PassengerRefs>` : ``}
        ${offerItem.SeatSelection && offerItem.SeatSelection.Column && offerItem.SeatSelection.Row ? createOfferItemSeatSelection(offerItem.SeatSelection) : ``}
    </OfferItem>`;
}

function createOfferItemSeatSelection(seatSelection: NDCSeatSelection): string {
    return `<SeatSelection>
                        <Row>${seatSelection.Row}</Row>
                        <Column>${seatSelection.Column}</Column>
                    </SeatSelection>`;
}
