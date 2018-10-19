import Promise from 'bluebird';
import { EventEmitter } from 'events';
import PdoMaps from './maps';

export default class PdoNode extends EventEmitter {
  /**
   * @constructor
   *
   * @param {Node} node
   */
  constructor(node) {
    super();

    this.node = node;
    this.network = null;

    this.rx = new PdoMaps(0x1400, 0x1600, this);
    this.tx = new PdoMaps(0x1800, 0x1A00, this);
  }

  /**
   * Find a map entry by name
   *
   * @param {String} name
   *
   * @return {DicVariable}
   */
  findByName(name) {
    return this.rx.findByName(name) || this.tx.findByName(name);
  }

  /**
   * @alias this.findByName
   */
  get(name) {
    return this.findByName(name);
  }

  /**
   * Read PDO configuration from node using SDO
   *
   * @return {Promise}
   */
  read() {
    const promises = [];

    [this.rx, this.tx].forEach((pdoMaps) => {
      Object.keys(pdoMaps.maps).forEach((m) => {
        const map = pdoMaps.maps[m];
        promises.push(map.read());
      });
    });

    return Promise.all(promises);
  }

  /**
   * Save PDO configuration to node using SDO
   *
   * return {Promise}
   */
  save() {
    const promises = [];

    [this.rx, this.tx].forEach((pdoMaps) => {
      Object.keys(pdoMaps.maps).forEach((m) => {
        const map = pdoMaps.maps[m];
        promises.push(map.save());
      });
    });

    return Promise.all(promises);
  }
}
