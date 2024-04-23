export interface SMDCard {
    id: string; // identifier of a card
    brand: string;  // The brand of the card ( visa, mastercard, amex, bancontact, diners, discover, jcb, maestro, uatp, unionpay, electron)
    accountNumber: string;  // The account number of the card
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    type: string;   // type of the card (debit, credit)
}
export interface ClaimWithCardResponse {
    card: SMDCard;
}
