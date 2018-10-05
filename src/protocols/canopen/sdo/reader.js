import Promise from 'bluebird';

const REQUEST_UPLOAD = 2 << 5;
const RESPONSE_UPLOAD = 2 << 5;

const REQUEST_SEGMENT_UPLOAD = 3 << 5;
const RESPONSE_SEGMENT_UPLOAD = 0 << 5;

const EXPEDITED = 0x2;
const SIZE_SPECIFIED = 0x1;
const TOGGLE_BIT = 0x10;
const NO_MORE_DATA = 0x1;

export default class SdoReader {
  /**
   * @constructor
   *
   * @param {SdoClient} sdo
   * @param {Integer} index The object dictionary index
   * @param {Integer} subindex The object dictionary subindex
   */
  constructor(sdo, index, subindex = 0) {
    this.sdo = sdo;
    this.index = index;
    this.subindex = subindex;

    this.reset();
  }

  /**
   * Reset reader state
   *
   * @return void
   */
  reset() {
    this.size = 0;
    this.toggle = 0;
    this.pos = 0;
    this.data = Buffer.alloc(0);
  }

  /**
   * Build request upload buffer
   *
   * @return {Buffer}
   */
  buildRequestUploadBuf() {
    const buffer = Buffer.alloc(8);

    buffer.writeUInt8(REQUEST_UPLOAD, 0);
    buffer.writeUInt16LE(this.index, 1);
    buffer.writeUInt8(this.subindex, 3);

    return buffer;
  }

  /**
   * Request upload to can slave
   *
   * @return {Promise<?Buffer>} Return buffer with data if EXPEDITED, else null
   */
  requestUpload() {
    const validateResponse = (message) => {
      if (!message) {
        return false;
      }

      let resCommand;
      let resIndex;
      let resSubindex;

      try {
        resCommand = message.data.readUInt8(0);
        resIndex = message.data.readUInt16LE(1);
        resSubindex = message.data.readUInt8(3);
      } catch (e) {
        return false;
      }

      // Check response validity
      if ((resCommand & 0xE0) !== RESPONSE_UPLOAD) {
        return false;
      }

      if (resIndex !== this.index) {
        return false;
      }

      if (resSubindex !== this.subindex) {
        return false;
      }

      return true;
    };

    return this.sdo.send(this.buildRequestUploadBuf(), validateResponse)
      .then((message) => {
        // Retrive response data
        const resCommand = message.data.readUInt8(0);
        // const resIndex = message.data.readUInt16LE(1);
        // const resSubindex = message.data.readUInt8(3);
        const resData = message.data.slice(4, 8);

        let expData;

        // If data is already in response (max 4 bytes)
        if (resCommand & EXPEDITED) {
          // Expedited upload
          if (resCommand & SIZE_SPECIFIED) {
            this.size = 4 - ((resCommand >> 2) & 0x3);
            expData = resData.slice(0, this.size);
          } else {
            expData = resData;
          }

          return expData;
        }

        if (resCommand & SIZE_SPECIFIED) {
          // Else get size of data to get with segmented transfer
          this.size = resData.readUInt32LE(0);
        }

        return null;
      });
  }

  /**
   * Append data to current this.data buffer
   *
   * @param {bufToAppend}
   *
   * @return void
   */
  appendData(bufToAppend) {
    this.data = Buffer.concat([this.data, bufToAppend]);
  }

  /**
   * Copy data buffer to a new buffer
   *
   * @return {Buffer}
   */
  getData() {
    const buf = Buffer.alloc(this.data.length);
    this.data.copy(buf);
    return buf;
  }

  readAll() {
    return new Promise((resolve, reject) => {
      this.requestUpload().then((buf) => {
        // if EXPEDITED, then return data
        if (buf) {
          this.reset();
          return resolve(buf);
        }

        // Use segmented upload
        const iterate = () => {
          this.read().then((response) => {
            let resCommand;

            try {
              resCommand = response.data.readUInt8(0);
            } catch (e) {
              return reject(e);
            }

            if ((resCommand & TOGGLE_BIT) !== this.toggle) {
              return reject(new Error('Toggle bit mismatch'));
            }

            const length = 7 - ((resCommand >> 1) & 0x7);
            this.toggle ^= TOGGLE_BIT;
            this.pos += length;

            // @TODO append data
            this.appendData(response.data.slice(1, (length + 1)));

            if (resCommand & NO_MORE_DATA) {
              const result = this.getData();
              this.reset();

              return resolve(result);
            }

            // Loop again
            return iterate();
          }).catch(reject);
        };

        return iterate();
      }, reject);
    });
  }

  /**
   * Build request segment upload buffer
   *
   * @WIP
   *
   * @return {Buffer}
   */
  buildRequestSegmentUploadBuf() {
    const buffer = Buffer.alloc(8);

    let command = REQUEST_SEGMENT_UPLOAD;
    command |= this.toggle;

    buffer.writeUInt8(command, 0);

    return buffer;
  }

  /**
   * Read value from CAN slave
   *
   * @WIP
   *
   * @return {Buffer}
   */
  read() {
    const validateResponse = (message) => {
      let command;

      try {
        command = message.data.readUInt8(0);
      } catch (e) {
        return false;
      }

      if (!message) {
        return false;
      }

      if ((command & 0xE0) !== RESPONSE_SEGMENT_UPLOAD) {
        return false;
      }

      return true;
    };

    return this.sdo.send(this.buildRequestSegmentUploadBuf(), validateResponse);
  }
}
