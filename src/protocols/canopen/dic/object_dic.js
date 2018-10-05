import {
  VISIBLE_STRING,
  UNICODE_STRING,
  INTEGER8,
  INTEGER16,
  INTEGER32,
  INTEGER64,
  UNSIGNED8,
  UNSIGNED16,
  UNSIGNED32,
  UNSIGNED64,
  OCTET_STRING,
  REAL32,
  REAL64,
  DOMAIN,
} from './types/types';

export DicVariable from './types/variable';
export DicArray from './types/array';
export DicRecord from './types/record';

export default class ObjectDic {
  static isSignedType(type) {
    return [
      INTEGER8,
      INTEGER16,
      INTEGER32,
      INTEGER64,
    ].indexOf(type) !== -1;
  }

  static isUnsignedType(type) {
    return [
      UNSIGNED8,
      UNSIGNED16,
      UNSIGNED32,
      UNSIGNED64,
    ].indexOf(type) !== -1;
  }

  static isIntegerType(type) {
    return this.isSignedType(type) || this.isUnsignedType(type);
  }

  static isFloatType(type) {
    return [REAL32, REAL64].indexOf(type) !== -1;
  }

  static isNumberType(type) {
    return this.isIntegerType(type) || this.isFloatType(type);
  }

  static isDataType(type) {
    return [
      VISIBLE_STRING,
      OCTET_STRING,
      UNICODE_STRING,
      DOMAIN,
    ].indexOf(type) !== -1;
  }

  /**
   * constructor
   */
  constructor() {
    // Base config
    this.bitrate = null;
    this.nodeId = null;

    this.indices = {};
    this.names = {};
  }

  /**
   * Add an object to dictionary
   *
   * @param {Object} obj
   *
   * @return {Object}
   */
  addObject(obj) {
    this.indices[obj.index] = obj;
    this.names[obj.name] = obj;

    return obj;
  }

  /**
   * Find an object by index
   *
   * @param {Integer} index
   *
   * @return {DicArray, DicRecord, DicVariable}
   */
  find(index) {
    return this.indices[index];
  }

  /**
   * Find an object by name
   *
   * @param {String} name
   *
   * @return {DicArray, DicRecord, DicVariable}
   */
  findByName(name) {
    return this.names[name];
  }
}
