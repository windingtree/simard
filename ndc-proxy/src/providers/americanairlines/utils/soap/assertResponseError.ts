/*
import {isSoapFault} from './isSoapFault';
import {extractSoapErrors} from './extractSoapErrors';
import {HttpRequestError} from '../../../../lib/webservices';

export async function assertResponseError(response: string): Promise<void> {
    if (await isSoapFault(response)) {
        const faults = await extractSoapErrors(response);
        const codes = faults.map((fault) => fault.faultcode).join(',');
        throw new HttpRequestError(`Error occurred while retrieving data from external system: ${codes}`, undefined, undefined);
    }
}
*/
