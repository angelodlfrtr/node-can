import Promise from 'bluebird';

/**
 * @TODO
 */

const SWITCH_MODE_GLOBAL = 0x04;
const CONFIGURE_NODE_ID = 0x11;
const CONFIGURE_BIT_TIMING = 0x13;
const STORE_CONFIGURATION = 0x17;
// const INQUIRY_NODE_IUD = 0x5E;

// const ERROR_NONE = 0;
// const ERROR_INADMISSIBLE = 1;
// const ERROR_STORE_NONE = 0;
// const ERROR_STORE_NOT_SUPPORTED = 1;
// const ERROR_ACCESS_PROBLEM = 2;

// const ERROR_VENDOR_SPECIFIC = 0xff;

// const LSS_TX_COBID = 0x7E5;
// const LSS_RX_COBID = 0x7E4;

const NORMAL_MODE = 0x00;
const CONFIGURATION_MODE = 0x01;

// const MAX_RETRIES = 3;
// const RESPONSE_TIMEOUT = 0.5;

export default class LssMaster {
  /**
   * @constructor
   */
  constructor() {
    this.network = null;
    this.nodeId = 0;
    this.data = null;
    this.modeState = NORMAL_MODE;

    // @TODO
    this.responses = [];
  }

  /**
   * Switch over NORMAL_MODE or CONFIGURATION_MODE
   *
   * @param {Integer} mode
   *
   * @return Promise
   */
  sendSwitchModeGlobal(mode) {
    const message = Buffer.alloc(8);

    if (mode === this.modeState) {
      return Promise.resolve();
    }

    message.writeUInt8(SWITCH_MODE_GLOBAL, 0);
    message.writeUInt8(mode, 1);

    this.modeState = mode;

    return this.sendCommand(message);
  }

  /**
   * Return current node id
   *
   * @return {Promise<Integer>}
   */
  inquireNodeId() {
    return this.sendSwitchModeGlobal(CONFIGURATION_MODE)
      .then(() => {
        // @TODO
      });
  }

  /**
   * Send a message to set a key with values
   *
   * @param {Integer} key
   * @param {Integer} val1
   * @param {Integer} val2
   *
   * @return {Promise}
   */
  sendConfigure(key, val1 = 0, val2 = 0) { // eslint-disable-line
    // @TODO
  }

  /**
   * Set the node id
   *
   * @param {Integer} nodeId
   *
   * @return {Promise}
   */
  configureNodeId(nodeId) {
    return this.sendSwitchModeGlobal(CONFIGURATION_MODE)
      .then(() => this.sendConfigure(CONFIGURE_NODE_ID, nodeId));
  }

  /**
   * Set bit timing
   *
   * @param {Integer} bitTiming
   *
   * @return {Promise}
   */
  configureBitTiming(bitTiming) {
    return this.sendSwitchModeGlobal(CONFIGURATION_MODE)
      .then(() => this.sendConfigure(CONFIGURE_BIT_TIMING, 0, bitTiming));
  }

  /**
   * Store node id & baud rate
   *
   * @return {Promise}
   */
  storeConfiguration() {
    return this.sendConfigure(STORE_CONFIGURATION);
  }

  /**
   * Send a command to network and wait for LSS response
   *
   * @param {Buffer} message
   *
   * @return {Promise} Promise with response
   */
  sendCommand(message) { // eslint-disable-line
    // @TODO
  }
}
