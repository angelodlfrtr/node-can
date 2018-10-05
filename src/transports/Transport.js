import Promise from 'bluebird';
import { EventEmitter } from 'events';

export default class Transport extends EventEmitter {
  /*
   * @constructor
   *
   * @param {Object} config
   */
  constructor(config = {}) {
    super();

    this.config = this.parseConfig(config);
  }

  /**
   * Connect to transport
   *
   * @return {Promise}
   */
  connect() { // eslint-disable-line
    return Promise.reject(new Error('Connection not implemented in this transport'));
  }

  /**
   * Wait for all data to be transmited
   *
   * @return {Promise}
   */
  drain() { // eslint-disable-line
    return Promise.resolve();
  }

  /**
   * Write data to transport
   *
   * @param {Buffer} data
   *
   * @return Promise
   */
  write(data) { // eslint-disable-line
    return Promise.reject(new Error('write not implemented in this transport'));
  }

  /*
   * Config parser
   *
   * @param {Object} config
   *
   * @return {Object}
   */
  parseConfig(config) { // eslint-disable-line
    return config;
  }
}
