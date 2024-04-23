import {HttpError} from 'routing-controllers';
import {HttpStatusCode} from './HttpStatuses';
import {ErrorCodes} from './ErrorCodes';

export class BaseGliderException extends HttpError {
    public readonly errorCode: ErrorCodes;

    constructor(httpCode: HttpStatusCode, message: string, errorCode: ErrorCodes) {
        super(httpCode, message);
        this.errorCode = errorCode;
    }

}
