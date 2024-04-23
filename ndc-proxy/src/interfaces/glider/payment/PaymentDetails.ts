import {CardType} from './CardType';
import {CardBrand} from './CardBrand';

export class PaymentDetails {
    public cardType: CardType;
    public cardBrand: CardBrand;
    public cardNumber: string;
    public cvcCode: string;
    public cardExpiryYear: string;
    public cardExpiryMonth: string;
    public cardHolderName: string;
    public billingAddressStreet: string;
    public billingAddressCity: string;
    public billingAddressState: string;
    public billingAddressPostal: string;
    public billingAddressCountryCode: string;
    public cardDetailsMasked = false;
}
