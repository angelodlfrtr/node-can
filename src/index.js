import transports from './transports';
import protocols from './protocols';

export class Bus {
  /**
   * @constructor
   *
   * @param {String} transportName The transport name, eg : 'socketCan' or 'usbAdapterV7'
   * @param {String} protocolName The protocol name, only 'canopen' actualy
   * @param {Object} config The specific config to apply to transport / protocol
   */
  constructor(transportName, protocolName, config = {}) {
    this.config = config;
    this.transport = this.getTransport(transportName);
    this.protocol = this.getProtocol(protocolName);
  }

  /**
   * Connect transport & start protocol listener
   *
   * @return Promise
   */
  run() {
    return this.transport.connect()
      .then(() => this.protocol.listen());
  }

  /**
   * Get an transport by name
   *
   * @param {String} name
   *
   * @return {transport}
   */
  getTransport(name) {
    const CanTransport = transports[name];

    if (!CanTransport) {
      return throw new Error(`Invalid ${name} transport`);
    }

    return new CanTransport(this.config);
  }

  /**
   * Get a protocol by name
   *
   * @param {String} name
   *
   * @return {Protocol}
   */
  getProtocol(name) {
    const CanProtocol = protocols[name];

    if (!CanProtocol) {
      return throw new Error(`Invalid ${name} protocol`);
    }

    return new CanProtocol(this.transport);
  }
}

export default Bus;
