import {GliderError} from '../errors/GliderError';

export const cardCodesOTA = {
  visa: 'VI',
  mastercard: 'MC',
  amex: 'AX',
  bancontact: 'BC',
  diners: 'DN',
  discover: 'DS',
  jcb: 'JC',
  maestro: 'MA',
  uatp: 'TP',
  unionpay: 'CU',
  electron: 'VE',
};

export const cardCodesIATA = {
  visa: 'VI',
  mastercard: 'CA',
  amex: 'AX',
  diners: 'DC',
  discover: 'DS',
  jcb: 'JC',
  uatp: 'TP',
};

export const getCardCode = (card: any, type: string): string => {
  let cardCode;
  switch (type) {
    case 'iata':
      cardCode = cardCodesIATA[card.brand.toLowerCase()];
      break;
    case 'ota':
      cardCode = cardCodesOTA[card.brand.toLowerCase()];
      break;
    default:
      console.log('going to throw');
      throw new GliderError('Missing Card Code type');
  }
  if (!cardCode) {
    throw new GliderError('Missing Card Code type');
  }
  return cardCode;
};
