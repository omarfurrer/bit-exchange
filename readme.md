**General explanation:**

-   The `src/client/index.js` file acts as an end user. It can simulate creating orders. It connects to the Grape network and can be used like the following:
```
node src/client/index.js <quantity> <type> <price>
node src/client/index.js 100 buy 10
```
- The `src/lock/index.js` file is used as centralized locking system. When orders are created a lock is acquired and once all the other clients on the network are notified, the lock is then released.
- The `src/server/index.js` file is used as the server (worker) for the trading engine itself which is supported behind the scenes by the `src/services/OrderbookManager.js`
- The `src/services/OrderbookManager.ts` file is the main logic behind the trading engine.

**How this application was tested:**

You will need to run:
```
npm install
npm i -g grenache-grape
```
To test the application the following has been performed (each instance is running in a separate terminal):
  - Spin up the grape network 
  ```
  grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002,127.0.0.1:20003'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001,127.0.0.1:20003'
grape --dp 20003 --aph 50001 --bn '127.0.0.1:20001,127.0.0.1:20002'
```
  - Spin up the lock client
```
node src/lock/index.js
```
  - Spin up 3 different servers (trade engine workers)
```
node src/server/index.js
node src/server/index.js
node src/server/index.js
```
  - Simulate creating orders. Example:
```
node src/client/index.js 100 buy 10
node src/client/index.js 100 buy 11
node src/client/index.js 50 sell 11
node src/client/index.js 75 sell 9
```
Actual orderbook after the above:
```
{
   "buy": [
      {
         "symbol": "BTC/USDT",
         "quantity": "75",
         "price": "10",
         "type": "buy",
         "id": 60,
         "timestamp": 1688164496573
      }
   ],
   "sell": []
}
```

**The following major points have been covered:**
- [x] Simple trading engine
- [x] Distributed network using grenache
- [x] Lock functionality to prevent race conditions
- [x] Synching between client orderbooks
- [x] Usage of BigNumber to avoid precision point errors
- [x] Simplified test cases for the main trading engine

**Disclaimer:**
- I had to specify ports when spinning up lock and trading workers because there was a weird behavior that happens at random where the grenache network assigns an outadated port to the client when connecting. This needs further investigation from my side, one likely culprit is that I am atm using an outdated node version `v12.13.0`
- Given I am using an older node version, if you are having issues setting up the project and running it on local please let me know.
- The `src/services/OrderbookManager.ts` has already been transpiled into `src/services/OrderbookManager.js` and is part of src control so it can be used straightway.

**Improvements:**

There is a huge amount of improvements that can be made, will mention some of them but the following list is non exhaustive:
- Better client awareness, we need to make sure that every single client has acknowledged the orderbook update, else, remove them from the network.
- Make sure that locks are able to expire. Followed by a fallback behavior.
- Use DB/file persistence instead of in memory.
- Leverage promises instead of callbacks.
- Implement multi currency orderbooks.
- Use a proper queue system.
- Much Better error handling.
- Better client orchestration, even with just using a simple global index file.
- Better unit test coverage.
- Better error handling between client connections for improved fault tolerance.
- Use a better locking library suited for distributed systems.
- Implement retries with exponential backoff.
- Use TS for the whole project.
- Improved logging with the possibility of using correlation IDs whithin logs.
- Better code and file dir structure.
- Better code seperation and reduce code duplication.
- Research a more performant way to update other client orderbooks.
- Others...