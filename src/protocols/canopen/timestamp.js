/**
 * @TODO
 */

// const OFFSET = 441763200;
// const ONE_DAY = 60 * 60 * 24;

export default class TimeProducer {
  /**
   * @constructor
   *
   * @param {Network} network
   */
  constructor(network) {
    this.network = network;
  }

  /**
   * Transmit timestamp
   *
   * @param {Integer} timestamp
   *
   * @return {Promise}
   */
  transmit(timestamp = null) { // eslint-disable-line
    // const delta = (timestamp || (+new Date())) - OFFSET;
    // const days = Math.trunc(delta, ONE_DAY);
    // const seconds = delta % ONE_DAY;

    // @TODO : struct / Struct
  }
}
