import {FarelogixConfiguration} from '../../../../env';

export function OrderRetrieveRQBuilder(config: FarelogixConfiguration, orderID: string, transactionID: string): string {
    console.log(`OrderRetrieveRQ, transactionID:${transactionID}`);
    return `<OrderRetrieveRQ Version="17.2" TransactionIdentifier="${transactionID}">
    <PointOfSale>
        <Location>
            <CountryCode>${config.pointOfSaleCountry}</CountryCode>
            <CityCode>${config.pointOfSaleCity}</CityCode>
        </Location>
    </PointOfSale>
    <Document />
    <Party>
        <Sender>
            <TravelAgencySender>
                <PseudoCity>${config.agencyPCC}</PseudoCity>
                <AgencyID>${config.agencyIATA}</AgencyID>
            </TravelAgencySender>
        </Sender>
    </Party>
    <OrderRetrieveParameters />
    <Query>
        <Filters>
            <OrderID Owner="${config.fareLogixAirlineId}">${orderID}</OrderID>
        </Filters>
    </Query>
</OrderRetrieveRQ>`;
}
