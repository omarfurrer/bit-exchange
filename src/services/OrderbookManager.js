"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var bignumber_js_1 = require("bignumber.js");
var PriorityQueue = /** @class */ (function () {
    function PriorityQueue(compareFn) {
        this.compareFn = compareFn;
        this._items = [];
    }
    PriorityQueue.prototype.enqueue = function (item) {
        if (this.isEmpty()) {
            this._items.push(item);
        }
        else {
            var added = false;
            for (var i = 0; i < this._items.length; i++) {
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
    };
    PriorityQueue.prototype.dequeue = function () {
        return this._items.shift();
    };
    PriorityQueue.prototype.isEmpty = function () {
        return !this._items.length;
    };
    PriorityQueue.prototype.size = function () {
        return this._items.length;
    };
    return PriorityQueue;
}());
var OrderBook = /** @class */ (function () {
    function OrderBook() {
        this.buyOrders = new PriorityQueue(function (a, b) {
            var priceComparison = b.price.comparedTo(a.price);
            if (priceComparison !== 0)
                return priceComparison;
            return a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0;
        });
        this.sellOrders = new PriorityQueue(function (a, b) {
            var priceComparison = a.price.comparedTo(b.price);
            if (priceComparison !== 0)
                return priceComparison;
            return a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0;
        });
    }
    OrderBook.prototype.processOrder = function (order) {
        // Don't you just love floating point precision issues :D
        order.price = new bignumber_js_1.BigNumber(order.price);
        order.quantity = new bignumber_js_1.BigNumber(order.quantity);
        this.validateOrder(order);
        if (order.type === 'buy') {
            this.buyOrders.enqueue(order);
        }
        else {
            this.sellOrders.enqueue(order);
        }
        console.log({
            message: "Order added to orderbook",
            order_id: order.id
        });
        this.matchOrders();
    };
    OrderBook.prototype.getOrderbook = function () {
        var buyOrders = this.buyOrders._items.map(function (order) {
            return __assign(__assign({}, order), { price: order.price.toString(), quantity: order.quantity.toString() });
        });
        var sellOrders = this.sellOrders._items.map(function (order) {
            return __assign(__assign({}, order), { price: order.price.toString(), quantity: order.quantity.toString() });
        });
        return {
            buy: buyOrders,
            sell: sellOrders
        };
    };
    // TODO: other validations
    OrderBook.prototype.validateOrder = function (order) {
        if (order.quantity.lte(0)) {
            throw new Error('Order quantity must be greater than 0');
        }
        if (order.price.lte(0)) {
            throw new Error('Order price must be greater than 0');
        }
    };
    OrderBook.prototype.matchOrders = function () {
        while (this.buyOrders.size() > 0 && this.sellOrders.size() > 0) {
            var highestBuyOrder = this.buyOrders.dequeue(); // get highest priority buy order
            var lowestSellOrder = this.sellOrders.dequeue(); // get highest priority sell order
            console.log("-----");
            console.log(highestBuyOrder);
            console.log(lowestSellOrder);
            console.log("-----");
            if (highestBuyOrder.price.isGreaterThanOrEqualTo(lowestSellOrder.price)) {
                // The highest buying price is greater or equal to the lowest selling price
                // We can execute a trade
                this.executeTrade(highestBuyOrder, lowestSellOrder);
            }
            else {
                // The buy and sell orders do not match
                // Add the orders back to their respective queues
                this.buyOrders.enqueue(highestBuyOrder);
                this.sellOrders.enqueue(lowestSellOrder);
                break;
            }
        }
    };
    OrderBook.prototype.executeTrade = function (buyOrder, sellOrder) {
        var quantityTraded = bignumber_js_1.BigNumber.min(buyOrder.quantity, sellOrder.quantity);
        buyOrder.quantity = buyOrder.quantity.minus(quantityTraded);
        sellOrder.quantity = sellOrder.quantity.minus(quantityTraded);
        console.log("Executed trade: " + quantityTraded + " units @ " + buyOrder.price + ". Buy order ID: " + buyOrder.id + ", Sell order ID: " + sellOrder.id);
        if (buyOrder.quantity.eq(0)) {
            console.log("Order " + buyOrder.id + " fully matched and removed from the order book");
        }
        else {
            this.buyOrders.enqueue(buyOrder);
            console.log("Order " + buyOrder.id + " partially matched and re-enqueued with remaining quantity " + buyOrder.quantity);
        }
        if (sellOrder.quantity.eq(0)) {
            console.log("Order " + sellOrder.id + " fully matched and removed from the order book");
        }
        else {
            this.sellOrders.enqueue(sellOrder);
            console.log("Order " + sellOrder.id + " partially matched and re-enqueued with remaining quantity " + sellOrder.quantity);
        }
    };
    return OrderBook;
}());
exports["default"] = OrderBook;
