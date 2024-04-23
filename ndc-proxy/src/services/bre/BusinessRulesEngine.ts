import {Service} from 'typedi';
import {SessionContext} from '../SessionContext';
import {FlightSearchCriteria, PassengerSearchCriteria} from '../../interfaces/glider';
import {FlightProviderAABusiness} from '../../providers/americanairlines/FlightProviderAABusiness';
import {FlightProviderAALeisure} from '../../providers/americanairlines/FlightProviderAALeisure';
import {BaseGliderException, ErrorCodes, HttpStatusCode} from '../../api/errors';
import {GuaranteeType} from './GuaranteeType';
import {FlightProviderUALeisure} from '../../providers/americanairlines/FlightProviderUALeisure';
import {conditionallyCreateFarelogixConfiguration, env} from '../../env';
import {ExtendedSessionContext} from '../ExtendedSessionContext';
import {LoggerFactory} from '../../lib/logger';
import {FlightProviderUABusiness} from '../../providers/americanairlines/FlightProviderUABusiness';

type AvailableProviders = 'AA_BUSINESS'|'AA_LEISURE'|'UA_LEISURE'|'UA_BUSINESS';
type PaymentType = 'token'|'deposit';
type EYProfile = 'business'|'leisure';
export type BookingFeeChargeProvider = 'STRIPE' | 'DATATRANS';

interface ORGiDProfile {
    orgID: string;
    providers: AvailableProviders[];
    payment_type: PaymentType;
    eyProfile: EYProfile;
    bookingFeeChargeProvider?: BookingFeeChargeProvider;
}
const ORGiDs: ORGiDProfile[] = [
    {
        orgID: '0x123123123123123123123',
        eyProfile: 'leisure',
        payment_type: 'token',
        providers: ['AA_LEISURE', 'UA_LEISURE'],
        bookingFeeChargeProvider: 'STRIPE',
    },
];

@Service()
export class BusinessRulesEngine {
    private log = LoggerFactory.createLogger('business rules engine');

    /**
     * Find available flight provider IDs which could be used to search for flights
     * @param sessionContext
     * @param itinerary
     * @param passengers
     */
    public async findProviderForSearchCriteria(sessionContext: SessionContext, itinerary: FlightSearchCriteria, passengers: PassengerSearchCriteria[]): Promise<string[]> {
        this.validateShoppingContext(sessionContext);
        const clientORGiD = sessionContext.clientORGiD;
        const orgIdProfile = this.getOrgIdProfile(clientORGiD);
        const eligibleFlightProviderIDs = [];
        if (!orgIdProfile) {
            this.log.warn(`No matching profile in Business Rules for requested ORGiD, orgID: ${sessionContext.clientORGiD}`);
            return [];
        }

        if (env.AA_BUSINESS_isEnabled === true && orgIdProfile.providers.includes('AA_BUSINESS')) {
            eligibleFlightProviderIDs.push(FlightProviderAABusiness.PROVIDERID);
        }
        if (env.AA_LEISURE_isEnabled === true  && orgIdProfile.providers.includes('AA_LEISURE')) {
            eligibleFlightProviderIDs.push(FlightProviderAALeisure.PROVIDERID);
        }
        if (env.UA_LEISURE_isEnabled === true && orgIdProfile.providers.includes('UA_LEISURE')) {
            eligibleFlightProviderIDs.push(FlightProviderUALeisure.PROVIDERID);
        }
        if (env.UA_BUSINESS_isEnabled === true && orgIdProfile.providers.includes('UA_BUSINESS')) {
            eligibleFlightProviderIDs.push(FlightProviderUABusiness.PROVIDERID);
        }
        if (eligibleFlightProviderIDs.length === 0) {
            this.log.warn(`No matching flight providers were found for search criteria/ORGiD, orgID: ${sessionContext.clientORGiD}`);
        }
        this.log.debug(`findProviderForSearchCriteria, orgID: ${sessionContext.clientORGiD}, found following providers: ${eligibleFlightProviderIDs}`);
        return eligibleFlightProviderIDs;
    }

    /**
     * For a given request (orgID, providerID) return what should be guarantee type (either Token, Deposit or Deposit claim with virtual card)
     * @param sessionContext
     * @param providerID
     */
    public async getDepositType(sessionContext: SessionContext, providerID: string): Promise<GuaranteeType> {
        this.validateShoppingContext(sessionContext);
        const clientORGiD = sessionContext.clientORGiD;
        const orgIdProfile = this.getOrgIdProfile(clientORGiD);
        if (!orgIdProfile) {
            this.log.warn(`No matching profile in Business Rules for requested ORGiD, orgID: ${sessionContext.clientORGiD}`);
            return GuaranteeType.DEPOSIT;
        }

        if (orgIdProfile.payment_type === 'token') {
            return GuaranteeType.TOKEN;
        }
        if (orgIdProfile.payment_type === 'deposit') {
            return GuaranteeType.DEPOSIT;
        }

        this.log.warn(`OrgID ${clientORGiD} is not explicitly configured to use neither TOKEN FLOW nor DEPOSIT - defaulting to DEPOSIT`);
        // default is DEPOSIT
        return GuaranteeType.DEPOSIT;
    }

    public isDBFEnabled(sessionContext: SessionContext, providerID: string): boolean {
        this.validateShoppingContext(sessionContext);
        const orgIdProfile = this.getOrgIdProfile(sessionContext.clientORGiD);
        // DBFs are enabled only for UA and EY Leisure profile
        return (providerID === FlightProviderUALeisure.PROVIDERID || providerID === FlightProviderUABusiness.PROVIDERID) && (orgIdProfile.eyProfile === 'leisure' || orgIdProfile.eyProfile === 'business');
    }

    public isBookingFeeChargeRequired(sessionContext: SessionContext, providerID: string): boolean {
        this.validateShoppingContext(sessionContext);
        const orgIdProfile = this.getOrgIdProfile(sessionContext.clientORGiD);

        return Boolean(orgIdProfile.bookingFeeChargeProvider);
    }

    public getBookingFeeChargeProvider(sessionContext: SessionContext,  providerID: string): BookingFeeChargeProvider | undefined {
        this.validateShoppingContext(sessionContext);
        return this.getOrgIdProfile(sessionContext.clientORGiD)?.bookingFeeChargeProvider;
    }

    public requiredBookingFeeAmount(sessionContext: SessionContext, providerID: string): { amount: number; currency: string } {
        const bookingFeeChargeProvider = this.getBookingFeeChargeProvider(sessionContext, providerID);

        if (bookingFeeChargeProvider === 'STRIPE') {
            return {amount: env.stripe.bookingFeeAmount, currency: env.stripe.bookingFeeCurrency};
        } else if (bookingFeeChargeProvider === 'DATATRANS') {
            return {amount: env.dataTrans.bookingFeeAmount, currency: env.dataTrans.bookingFeeCurrency};
        } else {
            // Do we need to return a currency here? Leaving it blank
            return {amount: 0, currency: ''};
        }

    }

    public getConfiguration(): any {
        return {
            orgIDsConfiguredForTokenPaymentFlow: ORGiDs.filter(value => value.payment_type === 'token'),
            orgIDsConfiguredForDepositPaymentFlow: ORGiDs.filter(value => value.payment_type === 'deposit'),
            orgIDsConfiguredForAmericanAirlinesLeisureAccount: ORGiDs.filter(value => value.providers.includes('AA_LEISURE')),
            orgIDsConfiguredForAmericanAirlinesBusinessAccount: ORGiDs.filter(value => value.providers.includes('AA_BUSINESS')),
            orgIDsConfiguredForUnitedAirlinesLeisure: ORGiDs.filter(value => value.providers.includes('UA_LEISURE')),
            orgIDsConfiguredForUnitedAirlinesBusiness: ORGiDs.filter(value => value.providers.includes('UA_BUSINESS')),
            };
    }

    /**
     * Each provider (e.g. UA, AA) may have it's own specific settings.
     * Those settings may depend on requesting client (e.g. EY Leisure, EY Business)
     * They may also depend on a specific provider (e.g. AA leisure setup, AA business setup, UA)
     * For example:
     *      - booking fee is required for EY leisure but not EY business
     *      - DBF (dynamic bundles) is required for UA but only if EY Leisure is creating a booking
     * Therefore we need to evaluate business rules knowing who the client is and which provider we are using at the moment.
     * Hence SessionContextProviderAware is supposed to carry all those details
     * It is supposed to be created once in the flow (per provider) to optimize performance (in the future we may use DB to store all those settings)
     * @param sessionContext
     * @param providerID
     */
    public async createExtendedSessionContext(sessionContext: SessionContext, providerID: string): Promise<ExtendedSessionContext> {
        // get provider specific configuration
        const farelogixConfiguration = conditionallyCreateFarelogixConfiguration(true, providerID);
        // create a copy of provided sessionContext (we don't want to modify existing one)
        // @ts-ignore
        const contextCopy: ExtendedSessionContext = Object.assign({}, sessionContext, farelogixConfiguration);

        contextCopy.depositType = await this.getDepositType(sessionContext, providerID);

        // add provider specific (or not only) flags

        // populate booking fee info
        contextCopy.isBookingFeeRequired = this.isBookingFeeChargeRequired(sessionContext, providerID);
        const { amount, currency } = this.requiredBookingFeeAmount(sessionContext, providerID);
        contextCopy.bookingFeeAmount = amount;
        contextCopy.bookingFeeCurrencyCode = currency;
        contextCopy.bookingFeeChargeProvider = this.getBookingFeeChargeProvider(sessionContext, providerID);

        contextCopy.isDBFEnabled = this.isDBFEnabled(sessionContext, providerID);
        return contextCopy;
    }

    public getOrgIdProfile(orgID: string): ORGiDProfile {
        return ORGiDs.find(profile => profile.orgID === orgID);
    }

    private validateShoppingContext(sessionContext: SessionContext): void {
        const clientORGiD = sessionContext.clientORGiD;
        if (!clientORGiD || clientORGiD.length === 0) {
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, 'Missing client ORGiD', ErrorCodes.INVALID_ORGID);
        }
    }
}
