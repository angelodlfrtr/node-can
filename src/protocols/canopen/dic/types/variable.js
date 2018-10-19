import Promise from 'bluebird';
import SdoReader from '../../sdo/reader';
import SdoWriter from '../../sdo/writer';
import DicEntity from './entity';

import {
  VISIBLE_STRING,
  UNICODE_STRING,
  BOOLEAN,
  INTEGER8,
  INTEGER16,
  INTEGER32,
  INTEGER64,
  UNSIGNED8,
  UNSIGNED16,
  UNSIGNED32,
  UNSIGNED64,
  REAL32,
  REAL64,
  DOMAIN,
} from './types';

export default class DicVariable extends DicEntity {
  /**
   * @constructor
   *
   * @param {String} name
   * @param {Integer} index
   * @param {Integer} subindex
   */
  constructor(name, index, subindex = 1) {
    super();

    this.unit = '';
    this.factor = 1;
    this.min = null;
    this.max = null;
    this.default = null;
    this.dataType = null;
    this.accessType = 'rw';
    this.description = '';

    this.data = Buffer.alloc(0);
    this.offset = null;

    this.index = index;
    this.subindex = subindex;
    this.name = name;

    this.valueDescriptions = {};
    this.bitDefinitions = {};

    this.sdo = null;
    this.sdoReader = null;
    this.sdoWriter = null;
  }

  /**
   * Set sdo in DicVariable
   *
   * @overwrite
   *
   * @param {SdoClient} sdo
   *
   * @return {DicRecord} this
   */
  bindSDO(sdo) {
    this.sdo = sdo;
    return this;
  }

  /**
   * Get data field lenght
   *
   * @return {Integer}
   */
  getDataLen() {
    let len = null;

    if (this.dataType === BOOLEAN) {
      len = 1;
    }

    if (this.dataType === INTEGER8) {
      len = 1;
    }

    if (this.dataType === INTEGER16) {
      len = 2;
    }

    if (this.dataType === INTEGER32) {
      len = 4;
    }

    if (this.dataType === INTEGER64) {
      len = 8;
    }

    if (this.dataType === UNSIGNED8) {
      len = 1;
    }

    if (this.dataType === UNSIGNED16) {
      len = 2;
    }

    if (this.dataType === UNSIGNED32) {
      len = 4;
    }

    if (this.dataType === UNSIGNED64) {
      len = 8;
    }

    if (this.dataType === REAL32) {
      len = 4;
    }

    if (this.dataType === REAL64) {
      len = 8;
    }

    if (len !== null) {
      return len * 8;
    }

    return 8;
  }

  /**
   * Add value description
   *
   * @param {String} value
   * @param {String} description
   *
   * @return void
   */
  addValueDescription(value, des) {
    this.valueDescriptions[value] = des;
  }

  /**
   * Add bit definition
   *
   * @param {String} name
   * @param {Array} bits
   *
   * @return void
   */
  addBitDefinition(name, bits) {
    this.bitDefinitions[name] = bits;
  }

  /**
   * Check SDO presence
   *
   * @return {Promise}
   */
  checkSDO() {
    if (!this.sdo) {
      return Promise.reject(new Error('SDO not connected for this DicVariable'));
    }

    return Promise.resolve();
  }

  /*
   * Read value using sdo
   *
   * @return {Promise<Buffer>}
   */
  read() {
    return this.checkSDO().then(() => {
      if (!this.sdoReader) {
        this.sdoReader = new SdoReader(this.sdo, this.index, this.subindex);
      }

      return this.sdoReader.readAll().then((value) => {
        this.data = value;
        return this.getRaw();
      });
    });
  }

  /*
   * Write value using sdo
   *
   * @param {Buffer} buf
   *
   * @return {Promise<Buffer>}
   */
  write(buf) {
    return this.checkSDO().then(() => {
      if (!this.sdoWriter) {
        this.sdoWriter = new SdoWriter(
          this.sdo,
          this.index,
          this.subindex,
          (this.dataType === DOMAIN),
        );
      }

      return this.sdoWriter.write(buf);
    });
  }

  /*
   * Get raw variable value
   *
   * @param {boolean} transform if set to false, return the raw data in a buffer
   *
   * @return {Promise<Integer,String,Buffer>}
   */
  getRaw(transform = true) {
    const buf = this.data;

    if (!transform) {
      return buf;
    }

    if (this.dataType === VISIBLE_STRING) {
      return buf.toString('ascii');
    }

    if (this.dataType === UNICODE_STRING) {
      return buf.toString('utf16le');
    }

    if (this.dataType === BOOLEAN) {
      return !!buf.readUInt8(0);
    }

    if (this.dataType === INTEGER8) {
      return buf.readInt8(0);
    }

    if (this.dataType === INTEGER16) {
      return buf.readInt16LE(0);
    }

    if (this.dataType === INTEGER32) {
      return buf.readInt32LE(0);
    }

    if (this.dataType === INTEGER64) {
      return buf.readIntLE(0, 8);
    }

    if (this.dataType === UNSIGNED8) {
      return buf.readUInt8(0);
    }

    if (this.dataType === UNSIGNED16) {
      return buf.readUInt16LE(0);
    }

    if (this.dataType === UNSIGNED32) {
      return buf.readUInt32LE(0);
    }

    if (this.dataType === UNSIGNED64) {
      return buf.readUIntLE(0, 8);
    }

    if (this.dataType === REAL32) {
      return buf.readFloatLE(0);
    }

    if (this.dataType === REAL64) {
      return buf.readDoubleLE(0);
    }

    // Return buffer in other cases (possible ?)
    throw new Error('Correspondance error between data and type');
  }

  /**
   * Transform value to a buffer
   *
   * @param {Any} value
   *
   * @return {Buffer}
   */
  valToBuf(value) {
    if (this.dataType === VISIBLE_STRING) {
      return Buffer.from(value, 'ascii');
    }

    if (this.dataType === UNICODE_STRING) {
      return Buffer.from(value, 'utf16le');
    }

    if (this.dataType === BOOLEAN) {
      if (value) {
        return Buffer.from([0x01]);
      }

      return Buffer.from([0x00]);
    }

    if (this.dataType === INTEGER8) {
      const buf = Buffer.alloc(1);
      buf.writeInt8(value, 0);
      return buf;
    }

    if (this.dataType === INTEGER16) {
      const buf = Buffer.alloc(2);
      buf.writeInt16LE(value, 0);
      return buf;
    }

    if (this.dataType === INTEGER32) {
      const buf = Buffer.alloc(4);
      buf.writeInt32LE(value, 0);
      return buf;
    }

    if (this.dataType === INTEGER64) {
      const buf = Buffer.alloc(8);
      buf.writeIntLE(value, 0, 8);
      return buf;
    }

    if (this.dataType === UNSIGNED8) {
      const buf = Buffer.alloc(1);
      buf.writeUInt8(value, 0);
      return buf;
    }

    if (this.dataType === UNSIGNED16) {
      const buf = Buffer.alloc(2);
      buf.writeUInt16LE(value, 0);
      return buf;
    }

    if (this.dataType === UNSIGNED32) {
      const buf = Buffer.alloc(4);
      buf.writeUInt32LE(value, 0);
      return buf;
    }

    if (this.dataType === UNSIGNED64) {
      const buf = Buffer.alloc(8);
      buf.writeUIntLE(value, 0, 8);
      return buf;
    }

    if (this.dataType === REAL32) {
      const buf = Buffer.alloc(4);
      buf.writeFloatLE(value, 0);
      return buf;
    }

    if (this.dataType === REAL64) {
      const buf = Buffer.alloc(8);
      buf.writeDoubleLE(value, 0);
      return buf;
    }

    return Buffer.from(value);
  }

  /*
   * Set raw variable value
   *
   * @param {Any} value
   *
   * @return {DicVariable} current dic variable
   */
  setRaw(value) {
    this.data = this.valToBuf(value);
    return this;
  }

  /**
   * Send current data using sdo
   *
   * @return {Promise}
   */
  save() {
    return this.write(this.data);
  }
}
