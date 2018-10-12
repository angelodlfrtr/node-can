import { EventEmitter } from 'events';
import NetworkScanner from './scanner';
import NmtMaster from '../nmt';
import Node from '../node';
import Message from '../../../common/message';

export default class Network extends EventEmitter {
  /**
   * @constructor
   *
   * @param {Transport} bus
   */
  constructor(bus) {
    super();

    this.bus = bus;
    this.scanner = new NetworkScanner(this);

    this.nmt = new NmtMaster(0, this);
    this.nmt.listenForHeartbeat();

    this.nodes = {};
  }

  /**
   * Star listening for messages
   *
   * @return void
   */
  start() {
    this.bus.on('message', this.handleMessage.bind(this));
  }

  /**
   * Stop listening for data events
   *
   * @return void
   */
  stop() {
    this.bus.removeEventListener('message', this.handleMessage);
  }

  /**
   * Handle bus messages events
   *
   * @param {Object} data
   * @param {Integer} data.arbitrationId
   * @param {Integer} data.dlc Data len
   * @param {Buffer} data.data Data len
   *
   * @return void
   */
  handleMessage(message) {
    // Associate node
    const nodeId = message.arbitrationId & 0x7F;
    const node = this.nodes[nodeId];

    if (node) {
      Object.assign(message, { node });

      // @TODO: parse sdo message
      // @TODO: parse pdo message

      // Emit message in specific node
      node.emit('message', message);
    }

    // Emit message in network
    this.emit(message.arbitrationId, message);
    this.emit('message', message);
  }

  /**
   * Add a node to a network
   *
   * @param {Integer} nodeId
   * @param {ObjectDic} objectDic
   * @param {Boolean} uploadEds
   *
   * @return {Node}
   */
  addNode(nodeId, objectDic = null, uploadEds = false) {
    if (uploadEds) {
      // @TODO: upload def from device if objectDic = null
    }

    const node = new Node(nodeId, objectDic);
    this.nodes[node.id] = node;
    node.associateNetwork(this);

    return node;
  }

  /**
   * Send a message in network
   *
   * @param {Integer} canId
   * @param {Buffer} data
   * @param {Boolean} remote
   *
   * @return {Promise}
   */
  sendMessage(canId, data, remote = false) {
    if (remote) {
      // @TODO
    }
    const message = new Message(canId, data, false, false);
    return this.bus.write(message);
  }
}
