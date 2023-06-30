// This is the server responsible for handling the orderbook and the trading algorithm
// This server technically also has a client which it can use to broadcast the new order to the other servers

'use strict';
const {
    PeerRPCServer,
    PeerRPCClient
} = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');

const orderbookManager = require('../services/OrderbookManager').default;

// Server

const serverlink = new Link({
    grape: 'http://127.0.0.1:30001'
});
serverlink.start();

const serverPeer = new PeerRPCServer(serverlink, {
    timeout: 300000
});
serverPeer.init();

const port = parseInt(process.argv[2]) || (1024 + Math.floor(Math.random() * 1000)); // TODO: investigate: sometimes a static port is needed, otherwise random port assignment doesn't work (random behavior)
const server = serverPeer.transport('server');
server.listen(port);

let clientLink, clientPeer, orderbook;

// Run immediately first
serverlink.announce('exchange_worker', server.port, {}, () => {
    console.log(`Server listening on port ${port}`);

    // Continuos ping
    setInterval(function () {
        serverlink.announce('exchange_worker', server.port, {});
    }, 1000);

    // Client init

    clientLink = new Link({
        grape: 'http://127.0.0.1:30001'
    });
    clientLink.start();

    clientPeer = new PeerRPCClient(clientLink, {});
    clientPeer.init();

    // Init orderbook
    orderbook = new orderbookManager();
});

server.on('request', (rid, key, payload, handler) => {
    // Debug
    console.log(payload);

    //  -- ADD ORDER --

    if (payload.type == 'addOrder') {

        // Attempt to acquire lock
        console.log(`Acquiring lock`);
        clientPeer.request('lock_worker', {
            type: 'requestLock',
            clientId: `client-${port}`
        }, {
            timeout: 10000 // Technically this will be the lock timeout if it's held by something else
        }, (err, data) => {

            // Error handling
            if (err) {
                console.error(err);
                process.exit(-1);
            }

            if (data.lockGranted == true) {
                console.log(`Lock acquired`);

                // Clone order since other clients need original data
                const orderClone = JSON.parse(JSON.stringify(payload.data));

                // Add to orderbook so that the simplified engine can match it 
                orderbook.processOrder(payload.data);

                // This is very verbose, mainly for debugging
                console.log(JSON.stringify(orderbook.getOrderbook(), null, 3));

                broadcastNewOrder(orderClone, () => {

                    // Attempt to release the lock
                    console.log(`Releasing lock`);
                    clientPeer.request('lock_worker', {
                        type: 'releaseLock',
                        clientId: `client-${port}`
                    }, {
                        timeout: 10000
                    }, (err, data) => {

                        // Error handling
                        if (err) {
                            console.error(err);
                            process.exit(-1);
                        }

                        if (data.lockReleased == true) {
                            console.log(`Lock released`);
                            handler.reply(null, {
                                message: `Order Added!`
                            });
                        }
                    });
                });
            }
        });
    }

    // GET ORDERBOOK

    if (payload.type == 'getOrderBook') {
        handler.reply(null, {
            orderbook: orderbook.getOrderbook()
        });
    }

    // ORDER ADDED

    if (payload.type == 'orderAdded') {
        // Using a different type than addOrder so that we can theoretically not do things like wallet balance udpdates, etc... These things should probably happen in the main client
        // We just want to update the orderbook
        if (payload.clientId !== `client-${port}`) {
            // This orderbook is now stale and needs to be updated
            // No lock is required ? since we are just getting data into sync, no new trades will actually happen
            orderbook.processOrder(payload.data);

            // This is very verbose, mainly for debugging
            console.log(JSON.stringify({
                buy: orderbook.buyOrders,
                sell: orderbook.sellOrders
            }, null, 3));
        }
        handler.reply(null, {
            message: `ACK!`
        });


    }
});

function broadcastNewOrder(order, cb) {
    clientPeer.map('exchange_worker', {
        clientId: `client-${port}`,
        type: 'orderAdded',
        data: order
    }, {
        timeout: 10000
    }, (err, data) => {
        if (err) {
            console.error(err);
            process.exit(-1);
        }
        console.log(data);
        cb(err, data);
    });
}