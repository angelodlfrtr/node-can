import Promise from 'bluebird';
import { EventEmitter } from 'events';

const NMT_STATES = {
  0: 'INITIALISING',
  4: 'STOPPED',
  5: 'OPERATIONAL',
  80: 'SLEEP',
  96: 'STANDBY',
  127: 'PRE-OPERATIONAL',
};

const NMT_COMMANDS = {
  OPERATIONAL: 1,
  STOPPED: 2,
  SLEEP: 80,
  STANDBY: 96,
  'PRE-OPERATIONAL': 128,
  INITIALISING: 129,
  RESET: 129,
  'RESET COMMUNICATION': 130,
};

const COMMAND_TO_STATE = {
  1: 5,
  2: 4,
  80: 80,
  96: 96,
  128: 127,
  129: 0,
  130: 0,
};

export default class NmtMaster extends EventEmitter {
  /**
   * @constructor
   *
   * @param {Integer} nodeId
   */
  constructor(nodeId, network = null) {
    super();

    this.id = nodeId;
    this.network = network;
    this.state = 0;
    this.stateReceived = null;
    this.timestamp = null;
  }

  listenForHeartbeat() {
    if (!this.network) {
      throw new Error('Network dont present');
    }

    const eventName = 0x700 + this.id;
    this.network.on(eventName, this.onHeartbeat.bind(this));
  }

  /**
   * On heartbeat message
   *
   * @param {Message} message
   *
   * @return void
   */
  onHeartbeat(message) {
    this.timestamp = message.timestamp;
    const newState = message.data.readUInt8(0);

    if (newState === 0) {
      this.state = 127;
    } else {
      this.state = newState;
    }

    this.emit(this.getState());
    this.emit('stateChanged', this.getState());

    this.stateReceived = newState;
  }

  /**
   * Send an NMT command code to the node
   *
   * @param {Integer} code
   *
   * @return {Promise}
   */
  sendCommand(code) {
    const message = Buffer.from([code, this.id]);

    if (COMMAND_TO_STATE[code]) {
      this.setState(COMMAND_TO_STATE[code]);
    }

    return this.network.sendMessage(0, message);
  }

  /**
   * Get NMT state
   *
   * @return {Integer}
   */
  getState() {
    if (NMT_STATES[this.state]) {
      return NMT_STATES[this.state].toLowerCase();
    }

    return this.state;
  }

  /**
   * Set NMT state
   *
   * @param {Integer} newState
   *
   * @return {Promise}
   */
  setState(newState) {
    if (!NMT_COMMANDS[newState]) {
      return Promise.reject(new Error('Invalid NMT state'));
    }

    const code = NMT_COMMANDS[newState];

    return this.sendCommand(code);
  }

  /**
   * Wait for bootup state
   *
   * @return {Promise}
   */
  waitForBootup(timeoutMs = 10000) {
    this.stateReceived = null;

    return new Promise((resolve, reject) => {
      let interval;

      const timeout = setTimeout(() => {
        clearInterval(interval);
        return reject(new Error('Timeout execeded'));
      }, timeoutMs);

      interval = setInterval(() => {
        if (this.stateReceived === 0) {
          clearTimeout(timeout);
          clearInterval(interval);

          return resolve();
        }

        return null;
      }, 10);
    });
  }
}
