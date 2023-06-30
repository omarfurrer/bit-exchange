'use strict';

const {
    PeerRPCServer
} = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');

// Server

const link = new Link({
    grape: 'http://127.0.0.1:40001',
});
link.start();

const peer = new PeerRPCServer(link, {
    timeout: 300000
});
peer.init();

const port = parseInt(process.argv[2]) || (1024 + Math.floor(Math.random() * 1000)); // TODO: investigate: sometimes a static port is needed, otherwise random port assignment doesn't work (random behavior)
const service = peer.transport('server');
service.listen(port);

// Run immediately first
link.announce('lock_worker', service.port, {}, () => {
    console.log(`Server listening on port ${port}`);

    // Continuos ping
    setInterval(function () {
        link.announce('lock_worker', service.port, {});
    }, 1000);
});

// Lock state
let lockHeld = false;
let lockQueue = [];

service.on('request', (rid, key, payload, handler) => {
    // Requesting a lock
    if (payload.type === 'requestLock') {
        console.log(`Lock requested from ${payload.clientId}`);
        // If the lock is free, grant it and set it as held
        if (!lockHeld) {
            lockHeld = true;
            handler.reply(null, {
                lockGranted: true
            });
        } else {
            // If the lock is held, queue the request
            lockQueue.push(handler);
        }
    }

    // Releasing a lock
    if (payload.type === 'releaseLock') {
        console.log(`Lock released from ${payload.clientId}`);
        // Mark the lock as free
        lockHeld = false;

        // If there are any waiting requests, grant the lock to the next one
        if (lockQueue.length > 0) {
            const nextHandler = lockQueue.shift();
            lockHeld = true;
            nextHandler.reply(null, {
                lockGranted: true
            });
        }

        handler.reply(null, {
            lockReleased: true
        });
    }
});