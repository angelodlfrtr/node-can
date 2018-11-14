import Promise from 'bluebird';
import * as socketcan from '../../build/Release/socketcan';
import * as jspack from 'jspack';
import Message from '../common/message';
import Transport from './Transport';

export default class USBCanAnalyserV7Transport extends Transport {
  /**
   * @constructor
   */
  constructor(config = {}) {
    super(config);
    this.currentBuf = Buffer.from([]);
  }

  /**
   * Parse a message
   *
   * @params {Buffer} buf
   *
   * @return {Object}
   */
  parseMessage(buf) { // eslint-disable-line
    // Get data len
    const dlc = buf.readUInt8(1) - 0xC0;

    // Get arbitration id @TODO: Do not use jspack
    const arbId = jspack.jspack.Unpack('<H', [buf.readUInt8(2), buf.readUInt8(3)])[0];

    // Get data
    const data = buf.slice(4, (4 + dlc));

    return new Message(arbId, data, dlc);
  }

  /**
   * Read message in a buffer and remove it from the same buffer
   *
   * @return {Buffer} The message in a buffer
   */
  readMessageFromBuf() {
    let buf = this.currentBuf.slice(); // Make a copy

    if (buf.length === 0) {
      return false;
    }

    while (true) { // eslint-disable-line
      if (!buf.length || buf.readUInt8(0) === 0xAA) {
        break;
      }

      buf = buf.slice(1);
    }

    if (!buf.length) {
      return false;
    }

    // Get data len
    const dLen = buf.readUInt8(1) - 0xC0;

    // Get full message len
    const tLen = 4 + dLen + 1;

    if (buf.length < tLen) {
      return false;
    }

    // Get full message
    const message = buf.slice(0, tLen);
    message.slice(0, tLen);

    this.currentBuf = buf.slice(tLen);

    return this.parseMessage(message);
  }

  /**
   * Handle data frames, removing serial specific vendor protocol data
   *
   * @param {Buffer} buf
   *
   * @return void
   */
  handleData(buf) {
    if (!buf.length) {
      return;
    }

    const tLen = this.currentBuf.length + buf.length;
    this.currentBuf = Buffer.concat([this.currentBuf, buf], tLen);
    const self = this;

    let message;

    while (message = this.readMessageFromBuf()) { // eslint-disable-line
      self.emit('message', message);
    }
  }

  /**
   * Connect to serial
   *
   * @return {Promise}
   */
  connect() {
    if (!this.channel) {
      // Create socketCAN channel
      this.channel = socketcan.RawChannel(this.config.interface, 0);

      // Listen for message on channel
      this.channel.addListener('onMessage', this.handleData.bind(this));
    }

    return Promise.resolve();
  }

  /**
   * Write message to portjnkA
   *
   * @param {Message} message
   *
   * @return {Promise}
   */
  write(message) {
    const self = this;
    const buf = this.messageToBuf(message);

    return new Promise((resolve, reject) => {
      // @TODO: test if a callback is present
      this.channel.send(buf);

      return resolve();
    });
  }

  /**
   * Convert a {Message} to a {Buffer}
   *
   * @param {Message}
   *
   * @return {Buffer}
   */
  messageToBuf(message) {
    const buffer = Buffer.alloc(4 + message.dlc + 1);
    buffer.writeUInt8(0xAA, 0);
    buffer.writeUInt8((0xC0 | message.dlc), 1);
    buffer.writeUInt32LE(message.arbitrationId, 2);

    for (let i = 0; i < message.data.length; i += 1) {
      buffer.writeUInt8(message.data.readUInt8(i), i + 4);
    }

    buffer.writeUInt8(0x55, buffer.length - 1);

    return buffer;
  }

  /**
   * Config parser
   *
   * @param {Object} config
   *
   * @return {Object}
   */
  parseConfig(config) {
    if (!config.interface) {
      throw new Error('config.interface is required');
    }

    this.interface = config.interface;

    return config;
  }
}
