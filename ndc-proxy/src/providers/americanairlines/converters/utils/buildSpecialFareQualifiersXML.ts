import {FarelogixConfiguration} from '../../../../env';

/**
 * Some airlines allow discounted fares which can be enabled by adding account code into the request
 * This function builds such a request if account code is enabled in configuration
 * @param config
 */

export function buildSpecialFareQualifiersXML(config: FarelogixConfiguration): string {
    if (config.accountCode && config.accountCode.length > 0) {
        const specialFareQualifiers = `<SpecialFareQualifiers>
            <AirlineID>${config.airlineCode}</AirlineID>
            <Account>${config.accountCode}</Account>
        </SpecialFareQualifiers>`;
        return specialFareQualifiers;
    } else {
        return '';
    }
}
