/**
 * Error thrown due to various problems that may occur while fetching data from external systems using either REST or SOAP calls
 */
export class HttpRequestError extends Error {
    public originalError: unknown;
    public url: string;
    constructor(message: string, url: string, originalError: unknown) {
        super(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, HttpRequestError);
        }
        this.name = 'HttpError';
        this.url = url;
        this.originalError = originalError;
    }
}
