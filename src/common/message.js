export default class Message {
  /**
   * @constructor
   *
   * @param {Integer} arbitrationId
   * @param {Buffer} dlc
   * @param {Buffer} data
   * @param {Buffer} timestamp
   * @param {Object} options
   */
  constructor(arbitrationId, data, dlc = null, timestamp = null, options = {}) {
    this.arbitrationId = arbitrationId;
    this.dlc = dlc || data.length;
    this.data = data;
    this.timestamp = timestamp || (+new Date());
    this.options = this.parseOptions(options);
  }

  /**
   * Parse constructor options and return complete options
   *
   * @param {Object} opts
   *
   * @return {Object}
   */
  parseOptions(opts) { // eslint-disable-line
    // @TODO
    return opts;
  }
}
