import Promise from 'bluebird';
import { EventEmitter } from 'events';
import DicVariable from '../dic/types/variable';

const PDO_NOT_VALID = 1 << 31;
const RTR_NOT_ALLOWED = 1 << 30;

export default class PdoMap extends EventEmitter {
  /**
   * @constructor
   *
   * @param {PdoNode} pdoNode
   * @param {DicRecord} comRecord
   * @param {DicArray} mapArray
   */
  constructor(pdoNode, comRecord, mapArray) {
    super();

    this.pdoNode = pdoNode;
    this.comRecord = comRecord;
    this.mapArray = mapArray;

    this.enabled = false;
    this.cobId = null;
    this.rtrAllowed = true;
    this.transType = null;
    this.eventTimer = null;

    // Variable mapped in this pdo
    this.map = [];

    // Current message data
    this.oldData = Buffer.alloc(0);
    this.data = Buffer.alloc(0);

    // Timestamp of last received message
    this.timestamp = null;

    // Period of receive message transmission in seconds
    this.period = null;

    this.isReceived = false;

    this.listening = false;
    this.listener = null;
  }

  /**
   * Find a var by index in map
   *
   * @param {Integer} index
   *
   * @return {DicVariable}
   */
  find(index) {
    return this.map[index];
  }

  /**
   * Find a var by name in map
   *
   * @param {String} name
   *
   * @return {DicVariable}
   */
  findByName(name) {
    let r = null;

    this.map.forEach((m) => {
      if (m.name === name) {
        r = m;
      }
    });

    return r;
  }

  /**
   * Get combined map size
   *
   * @return {Integer}
   */
  getTotalSize() {
    let t = 0;

    this.map.forEach((m) => {
      t += m.getDataLen();
    });

    return t;
  }

  /**
   * Update map data size
   *
   * @return void
   */
  updateDataSize() {
    const size = Math.ceil(this.getTotalSize() / 8);
    this.data = Buffer.alloc(size);
  }

  /**
   * Update data buffer and save last data in this.oldData
   *
   * @param {Buffer} newData
   *
   * @return {Buffer}
   */
  setData(newData) {
    this.oldData = this.data;
    this.data = newData;
  }

  listenForEvent() {
    if (!this.cobId) {
      throw new Error('call pdo.read() on this map before listening');
    }

    if (!this.listening) {
      this.timestamp = +new Date();
      this.listening = true;

      this.listener = (message) => {
        this.isReceived = true;
        this.setData(message.data);
        this.period = message.timestamp - this.timestamp;
        this.timestamp = message.timestamp;

        // Emit message in this map
        this.emit('message', message);

        // Check if value has any change compared to last message
        if (this.data.toString('hex') !== this.oldData.toString('hex')) {
          this.emit('change', message);
        }
      };

      this.pdoNode.network.on(this.cobId, this.listener);
    }
  }

  /**
   * Read PDO configuration for this map using sdo
   *
   * @return {Promise<void>}
   */
  read() {
    return this.comRecord.find(1).read().then((cobId) => {
      this.cobId = cobId;
      this.enabled = (cobId & PDO_NOT_VALID) === 0;
      this.rtrAllowed = (cobId & RTR_NOT_ALLOWED) === 0;

      return this.comRecord.find(2).read().then((transType) => {
        this.transType = transType;
        let evtTimerPromise = Promise.resolve(null);

        if (this.transType > 254 && this.comRecord.find(5)) {
          evtTimerPromise = this.comRecord.find(5).read();
        }

        return evtTimerPromise.then((eventTimer) => {
          this.eventTimer = eventTimer;

          this.map = [];
          let offset = 0;

          return this.mapArray.find(0).read().then((nofEntries) => {
            const rPromises = [];

            for (let i = 1; i <= (nofEntries + 1); i += 1) {
              rPromises.push(this.mapArray.find(i).read());
            }

            return Promise.all(rPromises).then((values) => {
              values.forEach((val) => {
                const index = val >> 16;
                const subindex = (val >> 8) & 0xFF;
                const size = val & 0xFF;

                if (size === 0) {
                  return;
                }

                let dicVar = this.pdoNode.node.objectDic.find(index);
                dicVar.size = size;

                if (dicVar instanceof DicVariable) {
                  dicVar.sdo = this.pdoNode.node.sdo;
                } else {
                  dicVar = dicVar.bindSDO(this.pdoNode.node.sdo);
                  dicVar = dicVar.find(subindex);
                }

                dicVar.offset = offset;
                this.map.push(dicVar);
                offset += size;
              });

              this.updateDataSize();
              return this.listenForEvent();
            });
          });
        });
      });
    });
  }

  /**
   * Write PDO configuration to a node
   *
   * @TODO: not working
   *
   * @return {Promise<void>}
   */
  save() {
    return this.comRecord.find(1).read().then((cobId) => {
      this.cobId = cobId;

      if (this.cobId === null) {
        this.cobId = this.cobId & 0x7FF;
      }

      if (this.enabled === null) {
        // @TODO: If not enabled, do not rely PDO messages on this map
        this.enabled = (cobId && PDO_NOT_VALID) === 0;
      }

      // Setting COB-ID 0x%X and temporarily disabling PDO
      //
      // @TODO: Not working, the value is not a correct data type
      return this.comRecord.find(1).setRaw(this.cobId | PDO_NOT_VALID).save().then(() => {
        let promises = [];

        if (this.transType !== null) {
          promises.push(this.comRecord.find(2).setRaw(this.transType).save());
        }

        if (this.eventTimer !== null) {
          promises.push(this.comRecord.find(5).setRaw(this.eventTimer).save());
        }

        return Promise.all(promises).then(() => {
          if (this.map && this.map.length) {
            return this.mapArray.find(0).setRaw(0).save().then(() => {
              promises = [];

              this.map.forEach((dicVar, i) => {
                const subindex = i + 1;
                const val = (dicVar.index << 16 | dicVar.subindex << 8 | dicVar.getDataLen());

                promises.push(this.mapArray.find(subindex).setRaw(val).save());
              });

              return Promise.all(promises).then(() => {
                return this.mapArray.find(0).setRaw(this.map.length).save()
                  .then(() => this.updateDataSize());
              });
            });
          }
        });
      });
    });
  }

  /**
   * Rebuild map data object from map variables
   *
   * return {void}
   */
  rebuildData() {
    let data = Buffer.allocUnsafe(Math.floor(this.getTotalSize() / 8));
    data.fill(0);

    this.map.forEach((dicVar) => {
      if (dicVar.data.length === 0) {
        return;
      }

      const dicOffset = Math.floor(dicVar.offset / 8);

      for (let i = 0; i < dicVar.data.length; i+= 1) {
        const offset = i + dicOffset;
        data[offset] = dicVar.data[i];
      }
    });

    this.setData(data);
  }

  /**
   * Send data to pdo node
   *
   * @return {Promise}
   */
  transmit(rebuild = true) {
    if (rebuild) {
      this.rebuildData();
    }

    return this.pdoNode.network.sendMessage(this.cobId, this.data);
  }
}
