import { Inject, Service } from 'typedi';
import { BookingFeeManager } from './BookingFeeManager';
import { RestClient } from '../webservices';
import { LoggerFactory } from '../logger';
import { ChargedAccountDetails } from './types';
import { env } from '../../env';
import {
  BaseGliderException,
  ErrorCodes,
  HttpStatusCode,
} from '../../api/errors';

@Service()
export class DataTransBookingFeeManager implements BookingFeeManager {
  public readonly bookingFeeDescription = env.dataTrans.bookingFeeDescription;
  @Inject()
  private restClient: RestClient;
  private log = LoggerFactory.createLogger('datatrans booking fee manager');

  /**
   * Authorize amount(using DataTrans API) for a tokenized card
   * Returns chargeID (transactionId) which is needed to capture authorized amount or to refund it
   * @param tokenDetails
   * @param amount
   * @param currencyCode
   * @param description
   */
  public async authorizeAmountFromTokenizedCard(
    tokenDetails: ChargedAccountDetails,
    amount: number,
    currencyCode: string,
    description: string,
    authorizationReference: string
  ): Promise<string | undefined> {
    this.log.debug(
      `Authorize booking fee, amount:${amount}${currencyCode}, aliasAccountNumber:${tokenDetails.aliasAccountNumber}`
    );

    // Datatrans needs an authorization reference number
    if (!authorizationReference) {
      this.log.error(
        'DataTrans Error: No authorization reference (refno) provided'
      );
      throw new BaseGliderException(
        HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR,
        'Internal server error',
        ErrorCodes.INVALID_PAYMENT_PROVIDER_DETAILS
      );
    }

    try {
      // make a call to DataTrans and provide card details to authorize amount
      const authorizeUrl =
        env.dataTrans.dataTransUrl + '/v1/transactions/authorize';
      const requestBody = {
        currency: currencyCode,
        refno: authorizationReference,
        card: {
          type: 'ALIAS',
          alias: tokenDetails.aliasAccountNumber,
          expiryMonth: tokenDetails.expiryMonth,
          expiryYear: tokenDetails.expiryYear.slice(-2), // always use 2 rightmost digits
        },
        amount,
        autoSettle: false,
      };

      const response = await this.restClient.postCall<any>(
        authorizeUrl,
        this.getRequestHeaders(),
        requestBody,
        10000
      );
      return response.transactionId;
    } catch (err) {
      this.log.error(
        `Failed to authorize amount, card alias ${tokenDetails.aliasAccountNumber}, error:${err}`
      );
      return undefined;
    }
  }

  public async captureCharge(
    chargeId: string,
    amount: number,
    currencyCode: string,
    authorizationReference: string
  ): Promise<boolean> {
    try {
      // Datatrans needs an authorization reference number
    if (!authorizationReference) {
      this.log.error(
        'DataTrans Error: No authorization reference (refno) provided'
      );
      throw new BaseGliderException(
        HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR,
        'Internal server error',
        ErrorCodes.INVALID_PAYMENT_PROVIDER_DETAILS
      );
    }

    this.log.debug(
      `Capture previously authorized booking fee, chargeID:${chargeId}, refNo:${authorizationReference}`
    );

      const captureUrl =
        env.dataTrans.dataTransUrl + `/v1/transactions/${chargeId}/settle`;
      const requestBody = {
        currency: currencyCode,
        refno: authorizationReference,
        amount,
      };

      await this.restClient.postCall<any>(
        captureUrl,
        this.getRequestHeaders(),
        requestBody,
        10000
      );
      return true;
    } catch (err) {
      this.log.error(
        `Failed to capture amount, chargeID ${chargeId}, refNo:${authorizationReference}, error:${err}`
      );
      return false;
    }
  }

  public async revertCharge(
    chargeId: string
  ): Promise<boolean> {
    this.log.debug(
      `Refund previously authorized booking fee, chargeID:${chargeId}`
    );
    try {
      const revertUrl =
        env.dataTrans.dataTransUrl + `/v1/transactions/${chargeId}/cancel`;
      await this.restClient.postCall<any>(
        revertUrl,
        this.getRequestHeaders(),
        {},
        10000
      );
      return true;
    } catch (err) {
      this.log.error(
        `Failed to refund amount, chargeID ${chargeId}, error:${err}`
      );
      return false;
    }
  }

  private getRequestHeaders = () => {
    const authKey = Buffer.from(`${env.dataTrans.merchantId}:${env.dataTrans.password}`).toString('base64');
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${authKey}`,
    };
  }
}
