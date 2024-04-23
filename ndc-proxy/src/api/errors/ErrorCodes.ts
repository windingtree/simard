export enum ErrorCodes {
    // generic errors 0-19
    UNKNOWN_ERROR= 'E00',
    OFFER_NOT_FOUND= 'E01',
    ORDER_NOT_FOUND= 'E02',
    INVALID_THIRDPARTY_RESPONSE= 'E03',
    THIRDPARTY_TIMEOUT= 'E04',

    // shopping errors 20-29
    NO_RESULTS_FOR_SEARCH_CRITERIA = 'E21',

    // seatmap errors 30-39

    // pricing errors 40-49

    // Order creation issues 50-59
    ORDER_CREATION_FAILED= 'E50',
    ORDER_ALREADY_EXIST_OR_IN_PROGRESS= 'E51',
    INSUFFICIENT_FUNDS= 'E52',

    // internal errors 60-70
    INVALID_SERVER_CONFIGURATION= 'E60',

    // ORGiD related errors 100-109
    ORGID_RETRIEVAL_FAILED= 'E100',
    INVALID_ORGID= 'E101',
    INVALID_JWT_TOKEN= 'E102',
    INVALID_AUTH_BEARER= 'E103',
    INSUFFICIENT_LIF_AMOUNT_STAKED= 'E104',
    ORGANISATION_IS_NOT_ACTIVE= 'E105',
    PUBLIC_KEY_NOT_FOUND= 'E106',
    INVALID_KEY= 'E107',

    // Guarantee/payment related 110-119
    INVALID_CARD_TOKEN= 'E110',
    INVALID_CARD_GUARANTEE= 'E111',
    INVALID_GUARANTEE_TYPE= 'E112',
    INVALID_CARD_DETAILS= 'E113',   // e.g. unsupported card brand
    INVALID_PAYMENT_PROVIDER_DETAILS = 'E114', // e.g invalid details provided for DataTrans
}
