import {SessionContext} from '../../../services/SessionContext';
import {decodeBearerToken, didFormatToORGiD, parseBearerToken} from '../../../lib/jwt';
import {JWTValidator} from '../../../lib/jwt';
import {LoggerFactory } from '../../../lib/logger';

export class BaseController {
    private logger = LoggerFactory.createLogger('base controller');
    constructor(
        private jwtValidator: JWTValidator
    ) {
    }
    protected async buildBaseSessionContext(bearerToken: string): Promise<SessionContext> {
        // create shopping context
        const jwtContent = await decodeBearerToken(bearerToken);
        const context: SessionContext = {
            clientORGiD: didFormatToORGiD(jwtContent.issuerDID),
        };
        return context;
    }
    protected async validateJWT(bearerToken: string): Promise<void> {
        const jwtText = parseBearerToken(bearerToken);
        await this.jwtValidator.validate(jwtText);
    }
    protected async ensureUserIsAuthenticated(bearerToken: string): Promise<void> {
        try {
            this.logger.debug(`client token:${bearerToken}`);
            await this.validateJWT(bearerToken);
            // create shopping context
        } catch (error: any) {
            this.logger.warn(`Invalid authorization, could not validate bearer token ${error}, token:${bearerToken}`);
            throw error;
        }
    }
}
