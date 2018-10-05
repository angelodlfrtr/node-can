import { EventEmitter } from 'events';

export default class Protocol extends EventEmitter {
  /**
   * @constructor
   */
  constructor(transport) {
    super();
    this.transport = transport;
  }
}
