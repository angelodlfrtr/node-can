import Promise from 'bluebird';

const SERVICES = [
  0x700,
  0x580,
  0x180,
  0x280,
  0x380,
  0x480,
  0x80,
];

export default class NetworkScanner {
  /**
   * @constructor
   * @param {Network} network
   */
  constructor(network) {
    this.network = network;
    this.nodes = [];
  }

  /**
   * On message received
   *
   * @param {Message} message
   *
   * @return void
   */
  onMessageReceived(message) {
    const canId = message.arbitrationId;
    const service = canId & 0x780;
    const nodeId = canId & 0x7F;

    if (SERVICES.indexOf(nodeId) === -1
      && nodeId !== 0
      && SERVICES.indexOf(service) !== -1) {
      if (this.nodes.indexOf(nodeId) === -1) {
        this.nodes.push(nodeId);
      }
    }
  }

  /**
   * Reset this.nodes to empty array
   *
   * @return void
   */
  reset() {
    this.nodes = [];
  }

  /**
   * Search for nodes
   *
   * @param {Integer} limit
   *
   * @return {Promise}
   */
  search(limit = 127) {
    const sdoReq = Buffer.from('\x40\x00\x10\x00\x00\x00\x00\x00');
    const promises = [];

    // Reset nodes list
    this.reset();

    for (let i = 1; i <= limit + 1; i += 1) {
      promises.push(this.network.sendMessage(0x600 + i, sdoReq));
    }

    return new Promise((resolve, reject) => {
      Promise.all(promises).then(() => {
        // Listen for messages form network
        const listener = this.onMessageReceived.bind(this);
        this.network.on('message', listener);

        // Wait 2 seconds (wait for responses of different devices, @maybe: other way ?)
        setTimeout(() => {
          // Remove messages listener on network
          this.network.removeListener('message', listener);
          return resolve(this.nodes);
        }, 2000);
      }, reject);
    });
  }
}
