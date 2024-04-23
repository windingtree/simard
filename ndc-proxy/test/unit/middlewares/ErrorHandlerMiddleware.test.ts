import MockExpressResponse from 'mock-express-response';
import {HttpError} from 'routing-controllers';

import {DEFAULT_ERROR_CODE, ErrorHandlerMiddleware} from '../../../src/api/middlewares/ErrorHandlerMiddleware';
import {LogMock} from '../../testutils/mocks/LogMock';
import {BaseGliderException} from '../../../src/api/errors/BaseGliderException';
import {HttpStatusCode} from '../../../src/api/errors/HttpStatuses';
import {ErrorCodes} from '../../../src/api/errors/ErrorCodes';

describe('ErrorHandlerMiddleware', () => {

    let log;
    let middleware;
    let err;
    let res;
    beforeEach(() => {
        log = new LogMock();
        middleware = new ErrorHandlerMiddleware(log);
        res = new MockExpressResponse();
        err = new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, 'Test HttpError', ErrorCodes.UNKNOWN_ERROR);
    });

    test('Should not print stack out in production', () => {
        middleware.isProduction = true;
        err = new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, 'Test BaseGliderException', ErrorCodes.UNKNOWN_ERROR);
        middleware.error(err, undefined, res, undefined);
        const json = res._getJSON();
        console.log('JSON:', json);
        console.log('ERR:', err);
        expect(json.code).toBe(err.errorCode);
        expect(json.message).toBe(err.message);
        expect(log.errorMock).toHaveBeenCalledWith(err.name, [err.message]);
    });

    test('Should print stack out in development', () => {
        middleware.isProduction = false;
        err = new BaseGliderException(400, 'Test BaseGliderException', ErrorCodes.UNKNOWN_ERROR);
        middleware.error(err, undefined, res, undefined);
        const json = res._getJSON();
        console.log('JSON:', json);
        console.log('ERR:', err);
        expect(json.code).toBe(err.errorCode);
        expect(json.message).toBe(err.message);
        expect(log.errorMock).toHaveBeenCalled();
    });
    test('Should return default error code (E01) if it is unknown HTTPError ', () => {
        middleware.isProduction = false;
        err = new HttpError(400, 'Test HttpError');
        middleware.error(err, undefined, res, undefined);
        const json = res._getJSON();
        console.log('JSON:', json);
        expect(json.code).toBe(DEFAULT_ERROR_CODE);
        expect(json.message).toBe(err.message);
        expect(log.errorMock).toHaveBeenCalled();
    });
    test('Should return default error code (E01) if it is unknown error  ', () => {
        middleware.isProduction = false;
        err = new Error('Test Unknown');
        middleware.error(err, undefined, res, undefined);
        const json = res._getJSON();
        console.log('JSON:', json);
        expect(json.code).toBe(DEFAULT_ERROR_CODE);
        expect(json.message).toBe(err.message);
        expect(log.errorMock).toHaveBeenCalled();
    });
});
