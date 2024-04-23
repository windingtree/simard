import {NDCCardType} from './NDCCardType';

export class NDCPaymentCard {
    public cardCode: NDCCardType;
    public cardNumber: string;
    public cardSeriesCode: string;
    public cardExpiryDate: string;
    public cardHolderName: string;
    public billingAddressStreet: string;
    public billingAddressCity: string;
    public billingAddressState: string;
    public billingAddressPostal: string;
    public billingAddressCountryCode: string;
}
