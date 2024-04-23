import {env, FarelogixConfiguration} from '../../../env';
import {SOAPClient, WebserviceDefinition} from '../../../lib/webservices';

export class FarelogicWebserviceClient extends SOAPClient {
    constructor(private farelogixConfig: FarelogixConfiguration) {
        super();
    }

    protected lazyInitializeWebserviceDefinitions(): WebserviceDefinition[] {
        const farelogixUrl = this.farelogixConfig.url;
        const soapHeaders = this.createSoapHeaders();
        const airShoppingRQ = new WebserviceDefinition('AirShoppingRQ', farelogixUrl, 'AirshoppingRQ', soapHeaders);
        const offerPriceRQ = new WebserviceDefinition('OfferPriceRQ', farelogixUrl, 'OfferPriceRQ', soapHeaders);
        const orderCreateRQ = new WebserviceDefinition('OrderCreateRQ', farelogixUrl, 'OrderCreateRQ', soapHeaders);
        const seatAvailabilityRQ = new WebserviceDefinition('SeatAvailabilityRQ', farelogixUrl, 'SeatAvailabilityRQ', soapHeaders);
        const offersRQ = new WebserviceDefinition('OffersRQ', farelogixUrl, 'OffersRQ', soapHeaders);
        const orderRetrieveRQ = new WebserviceDefinition('OrderRetrieveRQ', farelogixUrl, 'OrderRetrieveRQ', soapHeaders);

        const pciProxySoapHeaders = this.createPciProxyHeaders();
        const priProxyUrl = env.pciproxy.url;       // TODO externalize
        const orderCreateRQPciProxy = new WebserviceDefinition('OrderCreateRQ_PCIProxy', priProxyUrl, 'OrderCreateRQ', pciProxySoapHeaders);

        return [ airShoppingRQ, offerPriceRQ, orderCreateRQ, seatAvailabilityRQ, offersRQ, orderCreateRQPciProxy, orderRetrieveRQ ];
    }
    private createSoapHeaders(): any {
        return {
            'Ocp-Apim-Subscription-Key': this.farelogixConfig.apiKey,
            'PCC': this.farelogixConfig.agencyPCC,
            'Agency': this.farelogixConfig.agencyName,
            'IATA': this.farelogixConfig.agencyIATA,
        };
    }

    private createPciProxyHeaders(): any {
        const soapHeaders = this.createSoapHeaders();
        return Object.assign({}, soapHeaders, {
            'x-cc-merchant-id': env.pciproxy.merchantID,
            'pci-proxy-api-key': env.pciproxy.apiKey,
            'x-cc-url': this.farelogixConfig.url,
        });
    }
}
