import Promise from 'bluebird';
import * as jspack from 'jspack';
import Message from '../common/message';
import Transport from './Transport';

let socketcan;

try {
  socketcan = require('../../build/Release/socketcan');
} catch (e) {
  socketcan = {};
}

export default class SocketCanTransport extends Transport {
  /**
   * @constructor
   */
  constructor(config = {}) {
    super(config);
  }

  /**
   * Parse a message
   *
   * @params {Object} frame
   *
   * @return {Message}
   */
  parseFrame(frame) { // eslint-disable-line
    return new Message(frame.id, frame.data, frame.data.length);
  }

  /**
   * Handle data frames, removing serial specific vendor protocol data
   *
   * @param {Object} frame
   * @param {Integer} frame.id
   * @param {Buffer} frame.data
   *
   * @return void
   */
  handleData(frame) {
    if (!frame) {
      return;
    }

    const message = this.parseFrame(frame);
    this.emit('message', message);
  }

  /**
   * Connect to serial
   *
   * @return {Promise}
   */
  connect() {
    if (!this.channel) {
      // Create socketCAN channel
      this.channel = new socketcan.RawChannel(this.config.interface, true);

      // Listen for message on channel
      this.channel.addListener('onMessage', this.handleData.bind(this));

      // Start listening
      this.channel.start();
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
    const canFrame = this.messageToCanFrame(message);

    return new Promise((resolve, reject) => {
      const r = this.channel.send(canFrame);
      return resolve(r);
    });
  }

  /**
   * Convert a {Message} to a {Buffer}
   *
   * @param {Message}
   *
   * @return {Object}
   */
  messageToCanFrame(message) {
    return {
      id: message.arbitrationId,
      length: message.dlc,
      data: message.data,
    };
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
