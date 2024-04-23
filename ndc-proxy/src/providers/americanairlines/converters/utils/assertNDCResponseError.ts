import {NDCBaseResponse} from '../../../../interfaces/ndc';
import {BaseGliderException, ErrorCodes, HttpStatusCode} from '../../../../api/errors';

export function assertNoErrorInResponse(response: NDCBaseResponse): void {
    if (!response) {
        throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, 'No response from provider', ErrorCodes.INVALID_THIRDPARTY_RESPONSE);
    }
    if (Array.isArray(response.Errors) && response.Errors.length > 0) {
        const errorMessage = response.Errors.map(error => `${error.Code}:${error.Message}`).join(';');
        throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, errorMessage, ErrorCodes.INVALID_THIRDPARTY_RESPONSE);
    }
}
