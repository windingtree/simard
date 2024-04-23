import {extractSoapErrors} from './extractSoapErrors';

/**
 * Check SOAP response for errors (faults)
 * @param response
 */
export const isSoapFault = async (response: string): Promise<boolean> => {
    const faults = await extractSoapErrors(response);
    return faults.length > 0;
};
