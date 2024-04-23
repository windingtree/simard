import {Body, Get, HeaderParam, JsonController, Param, Post} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import {SearchCriteria, SearchResults} from '../../../interfaces/glider';
import {OffersService} from '../../../services/offers/OffersService';
import {SeatMapResponse} from '../../../interfaces/glider';
import {OptionSelectionCriteria, PricedOfferResponse} from '../../../interfaces/glider';
import {classToPlain} from 'class-transformer';
import {SeatmapRequest} from '../../../interfaces/glider';
import {LoggerFactory, logMessage} from '../../../lib/logger';
import {decodeBearerToken} from '../../../lib/jwt';
import {JWTValidator} from '../../../lib/jwt';
import {BaseController} from '../common/BaseController';
import {logExecutionTime} from '../../../lib/utils/logExecutionTime';

@JsonController('/v1/offers')
@OpenAPI({security: [{basicAuth: []}]})
export class OffersController extends BaseController {
    private log = LoggerFactory.createLogger('offers controller');
    constructor(
        private offersService: OffersService,
        jwtValidator: JWTValidator
    ) {
        super(jwtValidator);
    }

    @Post('/test')
    public async test(@HeaderParam('authorization') token: string): Promise<any> {
        this.log.debug('Bearer token:', token);
        const result = await decodeBearerToken(token);
        return {message: 'OK', token: result};
    }

    @Post('/search')
    @ResponseSchema(SearchResults)
    public async search(@Body() criteria: SearchCriteria, @HeaderParam('authorization') bearerToken: string): Promise<SearchResults> {
        let response;
        await logExecutionTime('POST /offers/search', async () => {
            await logMessage('Glider_searchRQ', JSON.stringify(classToPlain(criteria), undefined, 2), 'json');
            // for launch try to catch exception to feed troubleshooting data into logs - TO BE DISABLED really soon
            await super.ensureUserIsAuthenticated(bearerToken);
            const context = await super.buildBaseSessionContext(bearerToken);
            await logMessage('shoppingcontext', JSON.stringify(context), 'json');
            response = await this.offersService.searchOffers(context, criteria.itinerary, criteria.passengers);
            await logMessage('Glider_searchRS', JSON.stringify(classToPlain(response), undefined, 2), 'json');
        });
        return response;
    }

    @Post('/:offerIDs/price')
    @ResponseSchema(PricedOfferResponse)
    public async price(@Body() optionSelection: OptionSelectionCriteria[], @Param('offerIDs') offerIDs: string, @HeaderParam('authorization') bearerToken: string): Promise<PricedOfferResponse> {
        let response;
        await logExecutionTime('POST /offers/price', async () => {
            await logMessage('Glider_priceRQ', JSON.stringify(classToPlain({
                offerIDs,
                payload: optionSelection,
            }), undefined, 2), 'json');
            await super.ensureUserIsAuthenticated(bearerToken);
            // create shopping context
            const context = await super.buildBaseSessionContext(bearerToken);
            response = await this.offersService.priceOffers(context, offerIDs.split(','), optionSelection);
            await logMessage('Glider_priceRS', JSON.stringify(classToPlain(response), undefined, 2), 'json');
        });
        return response;
    }

    @Post('/:offerIDs/seatmap')
    @ResponseSchema(SeatMapResponse)
    public async seatmapPOST(@Body() seatmapRequest: SeatmapRequest, @Param('offerIDs') offerIDs: string, @HeaderParam('authorization') bearerToken: string): Promise<SeatMapResponse> {
        let response;
        await logExecutionTime('POST /offers/seatmap', async () => {
            await logMessage('Glider_seatmapRQ', JSON.stringify(classToPlain({
                offerIDs,
                payload: seatmapRequest,
            }), undefined, 2), 'json');
            await super.ensureUserIsAuthenticated(bearerToken);
            // create shopping context
            const context = await super.buildBaseSessionContext(bearerToken);

            response = await this.offersService.retrieveSeatmap(context, offerIDs.split(','), seatmapRequest);
            await logMessage('Glider_seatmapRS', JSON.stringify(classToPlain(response), undefined, 2), 'json');
        });
        return response;
    }

    @Get('/:offerIDs/seatmap')
    @ResponseSchema(SeatMapResponse)
    public async seatmapGET(@Param('offerIDs') offerIDs: string, @HeaderParam('authorization') bearerToken: string): Promise<SeatMapResponse> {
        let response;
        await logExecutionTime('GET /offers/seatmap', async () => {
            await logMessage('Glider_seatmapRQ', JSON.stringify(classToPlain({
                offerIDs,
                payload: {},
            }), undefined, 2), 'json');
            await super.ensureUserIsAuthenticated(bearerToken);
            // create shopping context
            const context = await super.buildBaseSessionContext(bearerToken);
            response = await this.offersService.retrieveSeatmap(context, offerIDs.split(','));
            await logMessage('Glider_seatmapRS', JSON.stringify(classToPlain(response), undefined, 2), 'json');
        });
        return response;
    }
}
