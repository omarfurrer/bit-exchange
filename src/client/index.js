// This is the true client
// The user client
// This will submit an order to be created

/*
node src/client/index.js 100 buy 10
node src/client/index.js 50 sell 10
*/

'use strict'

const {
    PeerRPCClient
} = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link');

const link = new Link({
    grape: 'http://127.0.0.1:50001'
});
link.start();

const peer = new PeerRPCClient(link, {});
peer.init();

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// get command line arguments
const quantity = process.argv[2];
const type = process.argv[3];
const price = process.argv[4];

// validate command line arguments
if (!quantity || !type || !price) {
    console.error('Missing arguments. Usage: node src/client/index.js <quantity> <type> <price>');
    process.exit(1);
}

// This will send it to only one grenache client
// This client doesn't care about how many instances there are in the network, this is the job for the grape network
peer.request('exchange_worker', {
    clientId: 'user',
    type: 'addOrder',
    data: {
        symbol: 'BTC/USDT',
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        type: type,
        id: randomIntFromInterval(1, 100),
        timestamp: Date.now()
    }
}, {
    timeout: 10000
}, (err, data) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(data);
    process.exit(0);
});