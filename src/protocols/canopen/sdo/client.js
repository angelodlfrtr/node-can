import { randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import Promise from 'bluebird';
import retry from 'retry';

const MAX_RETRIES = 3;
const RESPONSE_TIMEOUT = 1000;

export default class SdoClient extends EventEmitter {
  /**
   * @constructor
   */
  constructor(node) {
    super();

    this.node = node;
    this.rxCobId = 0x600 + node.id;
    this.txCobId = 0x580 + node.id;
    this.objectDic = node.objectDic;
    this.network = null;

    this.requests = [];
  }

  /**
   * Send a request via network
   *
   * @param {Buffer} request
   *
   * @return {Promise}
   */
  sendRequest(request) {
    return this.network.sendMessage(this.rxCobId, request);
  }

  /**
   * Create an entry in queue and resolve the `done` callback. Permit to block request pipe
   * outside of this class
   *
   * @important In this case, the external function must call `directSend` instead of `send`
   * Else a infinite loop will appear
   *
   * @return {Promise<Function>}
   */
  block() {
    const requestId = randomBytes(16).toString('hex');
    return this.requireRequestTime(requestId);
  }

  /**
   * Permit to ask for a position in request queue, and wait for request send ready
   *
   * @return {Promise<Function>} return promise with a 'done' function
   */
  requireRequestTime(id) {
    this.requests.push(id);

    const done = () => {
      this.requests.shift();
      this.emit('refresh');
    };

    if (this.requests.indexOf(id) === 0) {
      return Promise.resolve(done);
    }

    return new Promise((resolve) => {
      const onRefresh = () => {
        if (this.requests.indexOf(id) === 0) {
          this.removeListener('refresh', onRefresh);
          resolve(done);
        }
      };

      this.on('refresh', onRefresh);
    });
  }

  /**
   * Send a request in a blocking way
   *
   * @comment Sdo server's appear to not accept multiplexing. Is it right for all devices ?
   *
   * @param {Buffer} request
   * @param {Function} expectedMesHandler Function to validate expected response
   *
   * @return {Promise<Message>} Promise resolved to response message
   */
  send(request, expectedMesHandler = null) {
    const requestId = randomBytes(16).toString('hex');

    return this.requireRequestTime(requestId).then((done) => { // eslint-disable-line
      return this.directSend(request, expectedMesHandler).then((response) => {
        done();
        return response;
      }, (err) => {
        done();
        throw err;
      });
    });
  }

  /**
   * Send a request and wait for response
   *
   * @param {Buffer} request
   * @param {Function} expectedMesHandler A function to validate expected response
   *
   * @return {Promise<Message>} A promise resolved to response message
   */
  directSend(request, expectedMesHandler = null) {
    return new Promise((resolve, reject) => {
      const waitForResponse = !!expectedMesHandler;

      const operation = retry.operation({
        retries: MAX_RETRIES,
        minTimeout: 200,
        factor: 2,
      });

      operation.attempt(() => {
        this.sendRequest(request).then(() => {
          // If no response expected, end
          if (!waitForResponse) {
            return resolve(null);
          }

          let timeout;

          // Listen for messages
          const listener = (mess) => {
            if (expectedMesHandler(mess)) {
              this.network.removeListener(this.txCobId, listener);
              clearTimeout(timeout);
              resolve(mess);
            }
          };

          timeout = setTimeout(() => {
            this.network.removeListener(this.txCobId, listener);
            const err = new Error('No SDO response');

            if (operation.retry(err)) {
              return;
            }

            reject(operation.mainError());
          }, RESPONSE_TIMEOUT);

          return this.network.on(this.txCobId, listener);
        }, (err) => {
          if (operation.retry(err)) {
            return;
          }

          reject(operation.mainError());
        });
      });
    });
  }

  /**
   * Get an sdo object from object dictionary by name
   *
   * @param {String} name
   *
   * @return {DicRecord,DicArray,DicVariable}
   */
  get(name) {
    return this.objectDic.findByName(name).bindSDO(this);
  }
}
