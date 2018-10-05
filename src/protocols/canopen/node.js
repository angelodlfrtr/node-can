import { EventEmitter } from 'events';
import SdoClient from './sdo/client';
import PdoNode from './pdo/node';
import NmtMaster from './nmt';
import EmcyConsumer from './emcy/consumer';

export default class Node extends EventEmitter {
  /**
   * @constructor
   *
   * @param {Integer} nodeId
   * @param {ObjectDic} objectDic
   */
  constructor(nodeId, objectDic = null) {
    super();

    this.network = null;
    this.id = nodeId;

    if (!objectDic) {
      // @TODO: import dic from slave
    }

    this.sdo = new SdoClient(this.id, objectDic);
    this.pdo = new PdoNode(this, this.sdo);
    this.nmt = new NmtMaster(this.id);
    this.emcy = new EmcyConsumer();
  }

  /**
   * Associate a network {Network} to this node
   *
   * @param {Network} network
   *
   * @return void
   */
  associateNetwork(network) {
    this.network = network;
    this.sdo.network = network;
    this.pdo.network = network;
    this.nmt.network = network;

    this.nmt.listenForHeartbeat();

    // network.subscribe(this.sdo.txCobId, this.sdo.onResponse);
    // network.subscribe(0x100 + this.id, this.nmt.onHeartbeat);
    // network.subscribe(0x80 + this.id, this.emcy.onEmcy);
  }

  /**
   * Remove a network {Network} from this node
   *
   * @return void
   */
  removeNetwork() {
    this.network = null;
    this.sdo.network = null;
    this.pdo.network = null;
    this.nmt.network = null;
  }

  /**
   * Store parameters in non-volatile memory
   *
   * @param {Integer} subindex
   *
   * @return {Promise}
   */
  store(subindex = 1) {
    return this.sdo.download(0x1010, subindex, Buffer.from('save'));
  }

  /**
   * Restore default parameters
   *
   * @param {Integer} subindex
   *
   * @return {Promise}
   */
  restore(subindex = 1) {
    return this.sdo.download(0x1011, subindex, Buffer.from('load'));
  }
}
