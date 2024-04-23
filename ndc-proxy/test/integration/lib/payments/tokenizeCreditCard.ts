import axios from 'axios';
import {logMessage} from '../../../../src/lib/logger';

export const tokenizeCreditCard = async (card, cvc): Promise<any> => {
    console.log(`tokenizeCreditCard(${card},${cvc})`);
    try {
        const url = 'https://pay.sandbox.datatrans.com/upp/payment/SecureFields/paymentField';
        const body = `mode=TOKENIZE&formId=0&cardNumber=${card}&cvv=${cvc}&paymentMethod=VIS&merchantId=&browserUserAgent=Mozilla%2F5.0+(X11%3B+Ubuntu%3B+Linux+x86_64%3B+rv%3A94.0)+Gecko%2F20100101+Firefox%2F94.0&browserJavaEnabled=false&browserLanguage=en-US&browserColorDepth=24&browserScreenHeight=1080&browserScreenWidth=1920&browserTZ=-60`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:94.0) Gecko/20100101 Firefox/94.0',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
        };
        const response = await axios.post(url, body, {headers});
        const log = {
            url,
            body,
            headers,
        };
        await logMessage('tokenize-card-request', JSON.stringify(log), 'json');
        const data = await response.data;
        await logMessage('tokenize-card-response', JSON.stringify(data), 'json');
        // @ts-ignore
        const {transactionId, cardInfo: {brand, type, usage, country, issuer}} = data;
        console.log(`tokenizeCreditCard() OK -> transactionId:` + transactionId);
        return transactionId;
    } catch (err) {
        console.error(`Failed to tokenize card with PCI-Proxy, error:${err}`);
        throw err;
    }
};
