import {extractSoapErrors} from './extractSoapErrors';
import {logMessage} from '../../../../lib/logger';

export async function debugError(err: any): Promise<void> {
    console.log('Error message:', err.message);
    if (err.originalError) {
        const error = err.originalError;
        if (error.response) {
            await logMessage('fault', error.response.data);
            const soapFaults = await extractSoapErrors(error.response.data);
            console.log('Soap faults:', soapFaults);
            // Request made and server responded
            console.log('Response data:', error.response.data);
            console.log('Response status:', error.response.status);
            console.log('Response headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.log(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
        }
    }
}
