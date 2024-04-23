import camaro from 'camaro';

/**
 * Object to store soap fault details
 */
export interface SoapFault {
    faultcode: string;
    faultstring?: string;
}

/**
 * this template should extract any type of errors that may be in a SOAP response
 */
const template = {
    fault: [
        '//soapenv:Fault',
        {
            faultcode: 'soap:faultcode',
            faultstring: 'soap:faultstring',
        },
    ],
    error: [
        '//Errors/Error',
        {
            faultCode: '@Code',
        },
    ],
};

// check if there are any errors in SOAP response and if so - return an array of them
export const extractSoapErrors = async (response: string): Promise<SoapFault[]> => {
    const data = await camaro.transform(response, template) ;
    return [...data.fault, ...data.error];
};
