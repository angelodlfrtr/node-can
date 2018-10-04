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
    return this.comRecord.find(1).getRaw().then((cobId) => {
      this.cobId = cobId;
      this.enabled = (cobId & PDO_NOT_VALID) === 0;
      this.rtrAllowed = (cobId & RTR_NOT_ALLOWED) === 0;

      return this.comRecord.find(2).getRaw().then((transType) => {
        this.transType = transType;
        let evtTimerPromise = Promise.resolve(null);

        if (this.transType > 254 && this.comRecord.find(5)) {
          evtTimerPromise = this.comRecord.find(5).getRaw();
        }

        return evtTimerPromise.then((eventTimer) => {
          this.eventTimer = eventTimer;

          this.map = [];
          let offset = 0;

          return this.mapArray.find(0).getRaw().then((nofEntries) => {
            const rPromises = [];

            for (let i = 1; i <= (nofEntries + 1); i += 1) {
              rPromises.push(this.mapArray.find(i).getRaw());
            }

            return Promise.all(rPromises).then((values) => {
              values.forEach((val) => {
                const index = val >> 16;
                const subindex = (val >> 8) & 0xFF;
                const size = val & 0xFF;

                if (size === 0) {
                  return;
                }

                let dicVar = this.pdoNode.sdo.objectDic.find(index);

                if (dicVar instanceof DicVariable) {
                  dicVar.sdo = this.pdoNode.sdo;
                } else {
                  dicVar = dicVar.bindSDO(this.pdoNode.sdo);
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
}
