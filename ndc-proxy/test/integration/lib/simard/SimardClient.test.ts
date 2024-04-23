import {Container} from 'typedi';
import {bootstrapDIContext} from '../../../testutils/bootstrapDIContext';
import {
    SimardClient,
    SMDGuaranteeDetails,
    SMDGuaranteeID,
    SMDSettlement,
    SMDCard,
    ClaimWithCardResponse,
    SMDTokenDetails,
    SMDBillingAddress,
    SMDTravelComponentAir,
    SMDTravelComponentAirSegment,
} from '../../../../src/interfaces/simard';
import {env, testenv} from '../../../../src/env';
import {
    configureSimardClientToSimulateItIsGliderOTA,
    restoreSimardClientIssuerDetailsToDefaults
} from '../../../testutils/fixtures/simardClientInstrumentation';
import moment from 'moment';

jest.setTimeout(30000);
const simardClient: SimardClient = Container.get<SimardClient>(SimardClient);

// test should normally be skipped (manually triggered only)
describe('SimardClient', () => {

    beforeAll(() => {
        bootstrapDIContext();
    });
    // tslint:disable-next-line:no-empty
    beforeEach(() => {

    });
    afterEach(() => {
        // restore SimardClient properties as they might have changed
        restoreSimardClientIssuerDetailsToDefaults(simardClient);
    });

    test.skip('should retrieve a guarantee from Simard', async (done) => {
        const response = await simardClient.getGuarantee('bc8943e0-6887-4c3b-b858-342d8ebcce01');
        expect(response.amount).not.toBeUndefined();
        done();
    });
    test('simulate balance', async () => {
        // await simardClient.simulateDeposit(100, 'USD');
        const balancesBefore = await simardClient.getBalances();
        const usdAmountBefore = Number(balancesBefore.USD.total);
        const depositAmount = 100;
        await simardClient.simulateDeposit(depositAmount, 'USD');

        const balancesAfter = await simardClient.getBalances();

        const usdAmountAfter = Number(balancesAfter.USD.total);

        expect(usdAmountAfter).toEqual(usdAmountBefore + depositAmount);
    });
    test.skip('create, retrieve and cancel a guarantee', async (done) => {
        const currency = 'USD';
        const amount = 100;
        const guaranteeID: SMDGuaranteeID = await simardClient.createGuarantee(amount, currency, testenv.gliderOTAOrgId);
        expect(guaranteeID.guaranteeId).not.toBeUndefined();
        const guarantee: SMDGuaranteeDetails = await simardClient.getGuarantee(guaranteeID.guaranteeId);
        expect(guarantee.amount).toEqual(String(amount));
        expect(guarantee.creditorOrgId).toEqual(testenv.gliderOTAOrgId);
        expect(guarantee.currency).toEqual(currency);

        await simardClient.cancelGuarantee(guaranteeID.guaranteeId);    // this is expected to fail if we want to cancel guarantee before it expires

        expect(async () => {
            await simardClient.getGuarantee(guaranteeID.guaranteeId);
        }).toThrowError();
        done();
    });
    test.skip('create, retrieve and claim a guarantee', async (done) => {
        // simulate it's OTA making a call to Simard to create a guarantee for Glider
        configureSimardClientToSimulateItIsGliderOTA(simardClient);
        const currency = 'USD';
        const amount = 100;
        const guaranteeID: SMDGuaranteeID = await simardClient.createGuarantee(amount, currency, env.app.aggregatorOrgId);
        expect(guaranteeID.guaranteeId).not.toBeUndefined();

        // now simulate it's Glider Aggregator making a call to simard
        restoreSimardClientIssuerDetailsToDefaults(simardClient);
        const claim: SMDSettlement = await simardClient.claimGuarantee(guaranteeID.guaranteeId);
        expect(claim.settlementId).not.toBeUndefined();

        done();
    });

    test.skip('create and claim a guarantee with a card', async (done) => {
        // simulate it's OTA making a call to Simard to create a guarantee for Glider
        configureSimardClientToSimulateItIsGliderOTA(simardClient);
        const currency = 'USD';
        const amount = 100;
        const guaranteeID: SMDGuaranteeID = await simardClient.createGuarantee(amount, currency, env.app.aggregatorOrgId);
        expect(guaranteeID.guaranteeId).not.toBeUndefined();

        // now simulate it's Glider Aggregator making a call to simard
        restoreSimardClientIssuerDetailsToDefaults(simardClient);
        const cardResponse: ClaimWithCardResponse = await simardClient.claimGuaranteeWithCard(guaranteeID.guaranteeId);
        expect(cardResponse.card).not.toBeUndefined();
        expect(cardResponse.card.id).not.toBeUndefined();

        done();
    });

    test.skip('create virtual card', async (done) => {
        const currency = 'USD';
        const amount = 100;
        const card: SMDCard = await simardClient.createVirtualCard(amount, currency);
        expect(card.accountNumber).not.toBeUndefined();

        await simardClient.deleteVirtualCard(card.id);
        done();
    });

    test.skip('Get guarantee', async (done) => {
        const guarantee: SMDGuaranteeDetails = await simardClient.getGuarantee('478053f0-cd79-4447-9b16-288ad2ce403b');
        console.log('Guarantee:', guarantee);
        done();
    });

    test('Create and retrieve a token', async (done) => {
        const secureTransactionID = '220403131022749643';
        const receiverOrgId = testenv.gliderOTAOrgId;
        const expiryMonth = '03';
        const expiryYear = '2030';
        const cardholderName = 'John Smith';
        const billingAddress: SMDBillingAddress = {
            'countryCode': 'US',
            'stateProv': 'FL',
            'postalCode': '10114',
            'cityName': 'MIAMI',
            'street': '1 CIRCLE ROAD',
        };
        // create token
        const createdTokenData: SMDTokenDetails = await simardClient.createToken(receiverOrgId, secureTransactionID, cardholderName, expiryMonth, expiryYear, billingAddress);
        expect(createdTokenData.id).not.toBeUndefined();
        console.log('Token:', createdTokenData.id);

        // retrieve same token
        const retrievedTokenData: SMDTokenDetails = await simardClient.retrieveToken(createdTokenData.id);
        expect(retrievedTokenData).toEqual(createdTokenData);
        done();
    });
    test('Retrieve token', async (done) => {
        const tokenId = '0b4a2674-61d0-449c-bb74-aa8839666690';
        const retrievedToken: SMDTokenDetails = await simardClient.retrieveToken(tokenId);
        console.log('Token details:', retrievedToken);
        expect(retrievedToken.id).toEqual(tokenId);
        done();
    });

    test.skip('create travel components for a token', async () => {
        const airSegment: SMDTravelComponentAirSegment = {
            arrivalTime: moment().add(14, 'days').toISOString(),
            departureTime: moment().add(7, 'days').toISOString(),
            destination: 'JFK',
            origin: 'DFW',
            flightNumber: '0123',
            iataCode: 'AA',
            serviceClass: 'C',
        };
        const airComponent: SMDTravelComponentAir = {
            componentType: 'air',
            documentType: 'TKT',
            documentNumber: '12312312312312',
            recordLocator: 'ASDDSA',
            documentIssuanceDate: moment().format('YYYY-MM-DD'),
            segments: [airSegment],
        };
        const token = '62668fd1-8a8c-487c-950e-dab27bacb3dc';
        const response: boolean = await simardClient.createTokenComponents(token, [airComponent]);
        expect(response).toBe(true);
    });
    /*test('create guarantee with a token', async (done) => {
        const currency = 'USD';
        const amount = 100;
        const guaranteeID: SMDGuaranteeID = await simardClient.createGuarantee(amount, currency, testenv.gliderOTAOrgId);
        expect(guaranteeID.guaranteeId).not.toBeUndefined();
        const guarantee: SMDGuaranteeDetails = await simardClient.getGuarantee(guaranteeID.guaranteeId);
        console.log('guarantee:', guarantee);
        expect(guarantee.amount).toEqual(String(amount));
        expect(guarantee.creditorOrgId).toEqual(testenv.gliderOTAOrgId);
        expect(guarantee.currency).toEqual(currency);

        done();
    });*/
});
