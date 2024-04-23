export class GliderError extends Error {
    public originalError: unknown;
    public url: string;
    constructor(message: string, originalError: unknown|undefined  = undefined) {
        super(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GliderError);
        }
        this.name = 'GliderError';
        this.originalError = originalError;
    }
}
