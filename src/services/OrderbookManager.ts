import { BigNumber } from 'bignumber.js';

class PriorityQueue<T> {
    _items: T[] = [];

    constructor(private compareFn: (a: T, b: T) => number) { }

    enqueue(item: T): void {
        if (this.isEmpty()) {
            this._items.push(item);
        } else {
            let added = false;
            for (let i = 0; i < this._items.length; i++) {
                if (this.compareFn(item, this._items[i]) < 0) {
                    this._items.splice(i, 0, item);
                    added = true;
                    break;
                }
            }
            if (!added) {
                this._items.push(item);
            }
        }
    }

    dequeue(): T | undefined {
        return this._items.shift();
    }

    isEmpty(): boolean {
        return !this._items.length;
    }

    size(): number {
        return this._items.length;
    }
}


export interface Order {
    id: string;
    type: 'buy' | 'sell';
    quantity: BigNumber;
    price: BigNumber;
    timestamp: number; // added timestamp
}

export default class OrderBook {
    buyOrders: PriorityQueue<Order> = new PriorityQueue<Order>((a, b) => {
        const priceComparison = b.price.comparedTo(a.price);
        if (priceComparison !== 0) return priceComparison;
        return a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0;
    });

    sellOrders: PriorityQueue<Order> = new PriorityQueue<Order>((a, b) => {
        const priceComparison = a.price.comparedTo(b.price);
        if (priceComparison !== 0) return priceComparison;
        return a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0;
    });

    constructor() { }

    public processOrder(order: Order): void {
        // Don't you just love floating point precision issues :D
        order.price = new BigNumber(order.price);
        order.quantity = new BigNumber(order.quantity);

        this.validateOrder(order);
        if (order.type === 'buy') {
            this.buyOrders.enqueue(order);
        } else {
            this.sellOrders.enqueue(order);
        }
        console.log({
            message: `Order added to orderbook`,
            order_id: order.id
        });
        this.matchOrders();
    }

    // TODO: Add feature to pretty print the orderbook where tranches are grouped together based on price and for it to be displayed just like exchanges do
    public getOrderbook() {
        const buyOrders = this.buyOrders._items.map((order) => {
            return {
                ...order,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
            };
        });

        const sellOrders = this.sellOrders._items.map((order) => {
            return {
                ...order,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
            };
        });
        return {
            buy: buyOrders,
            sell: sellOrders
        }
    }

    // TODO: other validations
    private validateOrder(order: Order): void {
        if (order.quantity.lte(0)) {
            throw new Error('Order quantity must be greater than 0');
        }

        if (order.price.lte(0)) {
            throw new Error('Order price must be greater than 0');
        }
    }

    private matchOrders(): void {
        while (this.buyOrders.size() > 0 && this.sellOrders.size() > 0) {
            const highestBuyOrder = this.buyOrders.dequeue()!;  // get highest priority buy order
            const lowestSellOrder = this.sellOrders.dequeue()!; // get highest priority sell order
            if (highestBuyOrder.price.isGreaterThanOrEqualTo(lowestSellOrder.price)) {
                // The highest buying price is greater or equal to the lowest selling price
                // We can execute a trade
                this.executeTrade(highestBuyOrder, lowestSellOrder);
            } else {
                // The buy and sell orders do not match
                // Add the orders back to their respective queues
                this.buyOrders.enqueue(highestBuyOrder);
                this.sellOrders.enqueue(lowestSellOrder);
                break;
            }
        }
    }

    private executeTrade(buyOrder: Order, sellOrder: Order): void {
        const quantityTraded = BigNumber.min(buyOrder.quantity, sellOrder.quantity);

        buyOrder.quantity = buyOrder.quantity.minus(quantityTraded);
        sellOrder.quantity = sellOrder.quantity.minus(quantityTraded);

        console.log(`Executed trade: ${quantityTraded} units @ ${buyOrder.price}. Buy order ID: ${buyOrder.id}, Sell order ID: ${sellOrder.id}`);

        if (buyOrder.quantity.eq(0)) {
            console.log(`Order ${buyOrder.id} fully matched and removed from the order book`);
        } else {
            this.buyOrders.enqueue(buyOrder);
            console.log(`Order ${buyOrder.id} partially matched and re-enqueued with remaining quantity ${buyOrder.quantity}`);
        }

        if (sellOrder.quantity.eq(0)) {
            console.log(`Order ${sellOrder.id} fully matched and removed from the order book`);
        } else {
            this.sellOrders.enqueue(sellOrder);
            console.log(`Order ${sellOrder.id} partially matched and re-enqueued with remaining quantity ${sellOrder.quantity}`);
        }
    }
}
