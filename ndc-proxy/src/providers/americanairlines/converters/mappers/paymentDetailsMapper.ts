import {PaymentDetails} from '../../../../interfaces/glider';
import {NDCCardType, NDCPaymentDetails, NDCPaymentType} from '../../../../interfaces/ndc';
import {CardBrand, CardType} from '../../../../interfaces/glider';

export function toNdcPaymentDetails(gliderPaymentDetails: PaymentDetails, amount: number, currencyCode: string): NDCPaymentDetails {
    let cardNumber = gliderPaymentDetails.cardNumber || '';
    cardNumber = cardNumber.replace(/ /g, '');       // replace spaces in card number (if any)
    const card: NDCPaymentDetails = {
        type: toNdcCardType(gliderPaymentDetails.cardType),
        card: {
            cardCode: toNdcCardBrand(gliderPaymentDetails.cardBrand),
            cardNumber,
            cardSeriesCode: gliderPaymentDetails.cvcCode,
            cardExpiryDate: toNdcExpiryDate(gliderPaymentDetails.cardExpiryMonth, gliderPaymentDetails.cardExpiryYear),
            cardHolderName: gliderPaymentDetails.cardHolderName,
            billingAddressStreet: gliderPaymentDetails.billingAddressStreet,
            billingAddressCity: gliderPaymentDetails.billingAddressCity,
            billingAddressState: gliderPaymentDetails.billingAddressState,
            billingAddressPostal: gliderPaymentDetails.billingAddressPostal,
            billingAddressCountryCode: gliderPaymentDetails.billingAddressCountryCode,
        },
        amount: `${amount}`,
        currencyCode,
    };
    return card;
}

function toNdcCardType(cardType: CardType): NDCPaymentType {
    return NDCPaymentType.CC;   // so far only 'CC' exists, hardcoded
}
function toNdcCardBrand(cardBrand: CardBrand): NDCCardType {
    switch (cardBrand) {
        case CardBrand.diners:
            return NDCCardType.DC;
            break;
        case CardBrand.amex:
            return NDCCardType.AX;
            break;
        case CardBrand.visa:
            return NDCCardType.VI;
            break;
        case CardBrand.jcb:
            return NDCCardType.JC;
            break;
        case CardBrand.mastercard:
            return NDCCardType.CA;
            break;
        case CardBrand.discover:
            return NDCCardType.DS;
            break;
        case CardBrand.uatp:
            return NDCCardType.TP;
            break;
        default:
            throw new Error(`Unsupported card brand:${cardBrand}`);
    }
}

function toNdcExpiryDate(expiryMonth: string, expiryYear: string): string {
    let year = expiryYear;
    if (expiryYear.length > 2) {
        year = expiryYear.substr(2, 2);
    }
    return `${expiryMonth}${year}`;
}
