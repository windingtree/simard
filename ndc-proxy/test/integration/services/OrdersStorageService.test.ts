import {Container} from 'typedi';
import {closeDatabase, createDatabaseConnection} from '../../testutils/database';

import {bootstrapDIContext} from '../../testutils/bootstrapDIContext';
import {Connection} from 'typeorm';
import {generateUUID} from '../../../src/lib/uuid';
import {OrdersStorageService} from '../../../src/services/orders/OrdersStorageService';
import {EOrder} from '../../../src/database/models/EOrder';
import {OrderProcessingStage} from '../../../src/interfaces/glider';
import {GuaranteeType} from '../../../src/services/bre/GuaranteeType';

describe('OrdersStorageService', () => {

    let ordersStorageService: OrdersStorageService;
    let connection: Connection;
    let orderDetails;
    // -------------------------------------------------------------------------
    // Setup up
    // -------------------------------------------------------------------------

    beforeAll(async () => {
        bootstrapDIContext();
        connection = await createDatabaseConnection();
        ordersStorageService = Container.get<OrdersStorageService>(OrdersStorageService);
    });

    beforeEach(() => {
        orderDetails = {
            orderID: generateUUID(),
            offerID: generateUUID(),
            guaranteeID: generateUUID(),
            guaranteeType: GuaranteeType.TOKEN,
            providerID: 'AA',
        };
    });
    // -------------------------------------------------------------------------
    // Tear down
    // -------------------------------------------------------------------------

    afterAll(() => closeDatabase(connection));

    // -------------------------------------------------------------------------
    // Test cases
    // -------------------------------------------------------------------------

    describe('#saveOrderInProgress', () => {
        it('should store initial order record with status = IN_PROGRESS', async (done) => {
            const inProgressRecord = await ordersStorageService.saveOrderInProgress(orderDetails.offerID, {offerID: orderDetails.offerID, guaranteeID: orderDetails.guaranteeID});
            expect(inProgressRecord).not.toBeUndefined();
            expect(inProgressRecord.orderID).toEqual(orderDetails.offerID);     // initially orderID(in DB) = offerID (from params)...since at the begining of order creation we don't have orderID
            expect(inProgressRecord.processingStage).toEqual(OrderProcessingStage.IN_PROGRESS);     // initially orderID(in DB) = offerID (from params)...since at the begining of order creation we don't have orderID

            let foundOrder = await ordersStorageService.findOrderByOrderId(orderDetails.offerID); // db orderID = offerID, find by orderID
            expect(foundOrder).not.toBeUndefined();
            expect(foundOrder.orderID).toEqual(orderDetails.offerID);
            expect(foundOrder.offerID).toEqual(orderDetails.offerID);
            expect(foundOrder.processingStage).toEqual(inProgressRecord.processingStage);

            foundOrder = await ordersStorageService.findOrderByOfferId(orderDetails.offerID); // find by offerID
            expect(foundOrder).not.toBeUndefined();
            expect(foundOrder.orderID).toEqual(orderDetails.offerID);
            expect(foundOrder.offerID).toEqual(orderDetails.offerID);
            expect(foundOrder.processingStage).toEqual(inProgressRecord.processingStage);

            done();
        });
    });
    describe('#updateOrderDetails', () => {
        it('should update existing order details ', async (done) => {
            const inProgressRecord = await ordersStorageService.saveOrderInProgress(orderDetails.offerID, {offerID: orderDetails.offerID});
            console.log('inProgressRecord=', inProgressRecord.toString());
            expect(inProgressRecord).not.toBeUndefined();
            expect(inProgressRecord.orderID).toEqual(orderDetails.offerID);     // initially orderID(in DB) = offerID (from params)...since at the begining of order creation we don't have orderID
            expect(inProgressRecord.processingStage).toEqual(OrderProcessingStage.IN_PROGRESS);     // initially orderID(in DB) = offerID (from params)...since at the begining of order creation we don't have orderID

            // update order a) change record orderID from offerID to orderID b) status
            const savedOrder = await ordersStorageService.updateOrderDetails(orderDetails.offerID, {orderID: orderDetails.orderID, processingStage: OrderProcessingStage.COMPLETED});
            expect(savedOrder).not.toBeUndefined();
            expect(savedOrder.offerID).toEqual(orderDetails.offerID);
            expect(savedOrder.orderID).toEqual(orderDetails.orderID);
            expect(savedOrder.processingStage).toEqual(OrderProcessingStage.COMPLETED);

            // make sure it's not possible to find order by 'offerID' (since it was updated)
            let foundOrder = await ordersStorageService.findOrderByOrderId(orderDetails.offerID);
            expect(foundOrder).toBeUndefined();

            // make sure it's possible to find order by 'orderID'
            foundOrder = await ordersStorageService.findOrderByOrderId(orderDetails.orderID);
            expect(foundOrder).not.toBeUndefined();
            expect(foundOrder.offerID).toEqual(orderDetails.offerID);
            expect(foundOrder.orderID).toEqual(orderDetails.orderID);
            expect(foundOrder.processingStage).toEqual(OrderProcessingStage.COMPLETED);

            done();
        });
    });
    describe('#findOrderByOfferId', () => {
        it('should find existing order by offerID ', async (done) => {
            const order = new EOrder({orderID: orderDetails.orderID, processingStage: OrderProcessingStage.IN_PROGRESS, offerID: orderDetails.offerID, guaranteeID: orderDetails.guaranteeID, creationDate: new Date()});
            await ordersStorageService.saveOrder(order);

            const foundOrder = await ordersStorageService.findOrderByOfferId(orderDetails.offerID);
            expect(foundOrder).not.toBeUndefined();
            expect(foundOrder.offerID).toEqual(orderDetails.offerID);
            expect(foundOrder.orderID).toEqual(orderDetails.orderID);

            done();
        });
        it('should return undefined if no record is found ', async (done) => {
            const foundOrder = await ordersStorageService.findOrderByOfferId(generateUUID()); // search by random offerID should return undefined
            expect(foundOrder).toBeUndefined();
            done();
        });
    });
    describe('#findOrderByOrderId', () => {
        it('should find existing order by orderID ', async (done) => {
            const order = new EOrder({orderID: orderDetails.orderID, processingStage: OrderProcessingStage.IN_PROGRESS, offerID: orderDetails.offerID, guaranteeID: orderDetails.guaranteeID, creationDate: new Date()});
            await ordersStorageService.saveOrder(order);

            const foundOrder = await ordersStorageService.findOrderByOrderId(orderDetails.orderID);
            expect(foundOrder).not.toBeUndefined();
            expect(foundOrder.offerID).toEqual(orderDetails.offerID);
            expect(foundOrder.orderID).toEqual(orderDetails.orderID);

            done();
        });
        it('should return undefined if no record is found ', async (done) => {
            const foundOrder = await ordersStorageService.findOrderByOrderId(generateUUID()); // search by random offerID should return undefined
            expect(foundOrder).toBeUndefined();
            done();
        });
    });
});
