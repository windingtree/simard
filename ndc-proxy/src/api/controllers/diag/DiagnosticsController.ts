import {Get, HeaderParam, JsonController, Post} from 'routing-controllers';
import {OpenAPI} from 'routing-controllers-openapi';

import {decodeBearerToken} from '../../../lib/jwt';
import {BaseController} from '../common/BaseController';
import {JWTValidator} from '../../../lib/jwt/';
import {Inject} from 'typedi';
import {FlightSearchCriteria} from '../../../interfaces/glider';
import {BusinessRulesEngine} from '../../../services/bre/BusinessRulesEngine';
import {env} from '../../../env';
import {GuaranteeType} from '../../../services/bre/GuaranteeType';

@JsonController('/v1/admin/diag')
@OpenAPI({security: [{basicAuth: []}]})
export class DiagnosticsController extends BaseController {
    @Inject()
    private businessRulesEngine: BusinessRulesEngine;

    constructor(
        jwtValidator: JWTValidator
    ) {
        super(jwtValidator);
    }

    @Post('/token')
    public async test(@HeaderParam('authorization') token: string): Promise<any> {
        const response: any = {
            receivedToken: token,
            jwtValidationEnabled: env.orgID.jwtValidationEnabled,
        };
        let decodedToken;
        try {
            decodedToken = await decodeBearerToken(token);
            response.decoded = decodedToken;
        } catch (err: any) {
            response.error = `Failed to decode bearer token: ${err.message}`;
            return response;
        }
        try {
            await super.validateJWT(token);
            response.jwtValidationResult = true;
        } catch (err: any) {
            response.jwtValidationResult = false;
            response.error = `Failed to validate JWT & ORGiD: ${err.message}`;
            return response;
        }
        return response;
    }

    // this endpoint is just to check which providerID (e.g. AA Leisure, AA Business, UA) is applicable for provided JWT
    @Post('/providerCheck')
    public async providerCheck(@HeaderParam('authorization') token: string): Promise<any> {
        await super.ensureUserIsAuthenticated(token);
        const shoppingContext = await super.buildBaseSessionContext(token);
        const providerIDs: string[] = await this.businessRulesEngine.findProviderForSearchCriteria(shoppingContext, new FlightSearchCriteria(), []);
        const guaranteeType: GuaranteeType = await this.businessRulesEngine.getDepositType(shoppingContext, providerIDs.length > 0 ? providerIDs[0] : 'UNKNOWN');
        let paymentFlowName = 'UNKNOWN';
        if (guaranteeType === GuaranteeType.DEPOSIT) {
            paymentFlowName = 'DEPOSIT FLOW';
        } else if (guaranteeType === GuaranteeType.TOKEN) {
            paymentFlowName = 'TOKEN FLOW';
        }
        return {
            orgIDFromJWT: shoppingContext.clientORGiD,
            providersConfiguredForUsedOrgId: providerIDs,
            orgIdProfile: this.businessRulesEngine.getOrgIdProfile(shoppingContext.clientORGiD),
            paymentFlowConfiguredForUsedOrgId:  paymentFlowName,
            businessRules: this.businessRulesEngine.getConfiguration(),
        };
    }

    @Get('/version')
    public async getGitVersion(@HeaderParam('authorization') token: string): Promise<any> {
        await super.ensureUserIsAuthenticated(token);
        // get git version from env
        return {...env.gitVersion};
    }
}
