import { EventEmitter } from 'events';

export default class EmcyConsumer extends EventEmitter {
  /**
   * @constructor
   */
  constructor() {
    super();

    this.log = [];
    this.active = [];
    this.callbacks = [];
  }

  /**
   * Called on emergency message
   *
   * @TODO: Send message to network : this.network.emit('emergency', ...)
   *
   * @param {Integer} canId
   * @param {Buffer} data
   * @param {Integer} timestamp
   *
   * @return void
   */
  onEmcy(canId, data, timestamp) {
    Object.assign(data, { timestamp });
    this.emit(canId, data);
  }

  /**
   * Add a callback to emcy messages
   *
   * @param {Function} callback
   *
   * @return void
   */
  addCallback(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Reset log & active lists
   *
   * @return void
   */
  reset() {
    this.log = [];
    this.active = [];
  }
}
