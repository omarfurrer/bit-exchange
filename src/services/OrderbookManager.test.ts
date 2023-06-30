import { BigNumber } from 'bignumber.js';
import OrderBook, { Order } from './OrderbookManager';

describe('OrderBook', () => {
    let orderBook: OrderBook;

    beforeEach(() => {
        orderBook = new OrderBook();
    });

    test('processOrder adds buy order to buyOrders', () => {
        const order: Order = {
            id: '1',
            type: 'buy',
            quantity: new BigNumber(1),
            price: new BigNumber(20000),
            timestamp: Date.now(),
        };
        orderBook.processOrder(order);
        expect(orderBook.buyOrders.size()).toBe(1);
        expect(orderBook.sellOrders.size()).toBe(0);
    });

    test('processOrder adds sell order to sellOrders', () => {
        const order: Order = {
            id: '2',
            type: 'sell',
            quantity: new BigNumber(1),
            price: new BigNumber(20000),
            timestamp: Date.now(),
        };
        orderBook.processOrder(order);
        expect(orderBook.sellOrders.size()).toBe(1);
        expect(orderBook.buyOrders.size()).toBe(0);
    });

    test('matchOrders correctly matches a buy and sell order', () => {
        const buyOrder: Order = {
            id: '3',
            type: 'buy',
            quantity: new BigNumber(1),
            price: new BigNumber(20000),
            timestamp: Date.now(),
        };

        const sellOrder: Order = {
            id: '4',
            type: 'sell',
            quantity: new BigNumber(1),
            price: new BigNumber(20000),
            timestamp: Date.now(),
        };

        orderBook.processOrder(buyOrder);
        orderBook.processOrder(sellOrder);

        // After matching, both buyOrders and sellOrders should be empty
        expect(orderBook.buyOrders.size()).toBe(0);
        expect(orderBook.sellOrders.size()).toBe(0);
    });

    test('should handle partial orders correctly', () => {
        const orderBook = new OrderBook();

        const buyOrder: Order = {
            id: "1",
            type: 'buy',
            quantity: new BigNumber(10),
            price: new BigNumber(200),
            timestamp: Date.now()
        };

        const sellOrder1: Order = {
            id: "2",
            type: 'sell',
            quantity: new BigNumber(5),
            price: new BigNumber(200),
            timestamp: Date.now()
        };

        const sellOrder2: Order = {
            id: "3",
            type: 'sell',
            quantity: new BigNumber(5),
            price: new BigNumber(200),
            timestamp: Date.now()
        };

        orderBook.processOrder(buyOrder);
        orderBook.processOrder(sellOrder1);
        orderBook.processOrder(sellOrder2);

        const orderbookData = orderBook.getOrderbook();

        // buyOrder should have been fulfilled and not be in the buyOrders anymore
        expect(orderbookData.buy).toHaveLength(0);

        // sellOrder1 and sellOrder2 should have been fulfilled and not be in the sellOrders anymore
        expect(orderbookData.sell).toHaveLength(0);
    });
});

