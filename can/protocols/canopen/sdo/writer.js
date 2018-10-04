const REQUEST_DOWNLOAD = 1 << 5;
const RESPONSE_DOWNLOAD = 3 << 5;

// const REQUEST_SEGMENT_DOWNLOAD = 0 << 5;
// const RESPONSE_SEGMENT_DOWNLOAD = 1 << 5;

const EXPEDITED = 0x2;
const SIZE_SPECIFIED = 0x1;

export default class SdoWriter {
  /**
   * @constructor
   *
   * @param {SdoClient} sdo
   * @param {Integer} index The object dictionary index
   * @param {Integer} subindex The object dictionary subindex
   */
  constructor(sdo, index, subindex = 0, forceSegment = false) {
    this.sdo = sdo;
    this.index = index;
    this.subindex = subindex;

    this.done = false;
    this.toggle = 0;
    this.pos = 0;
    this.size = null;
    this.forceSegment = forceSegment;
  }

  /**
   * Reset reader state
   *
   * @return void
   */
  reset() {
    this.done = false;
    this.toggle = 0;
    this.pos = 0;
    this.size = null;
  }

  /**
   * Build request download buffer
   *
   * @param {Integer} data size
   * @param {Buffer} data
   *
   * @return {Buffer}
   */
  buildRequestDownloadBuf(data = null, size = null) {
    const buffer = Buffer.alloc(8);
    let command = REQUEST_DOWNLOAD;
    let type = 'segmented';

    if (size !== null) {
      command |= SIZE_SPECIFIED;
      buffer.writeUInt32LE(size, 4);
    }

    // Write object index / subindex
    buffer.writeUInt16LE(this.index, 1);
    buffer.writeUInt8(this.subindex, 3);

    // Segmented download
    if (size === null || size > 4 || this.forceSegment) {
      buffer.writeUInt8(command, 0);
      return buffer;
    }

    // Expedited download, so data is directly in download request message
    type = 'expedited';
    command = REQUEST_DOWNLOAD | EXPEDITED | SIZE_SPECIFIED;
    command |= (4 - size) << 2;

    // Write command
    buffer.writeUInt8(command, 0);

    // Write data
    for (let i = 0; i < size; i += 1) {
      buffer.writeUInt8(data.readUInt8(i), i + 4);
    }

    return {
      type,
      buffer,
    };
  }

  /**
   * Request download to can slave
   *
   * @param {Buffer} data
   *
   * @return {Promise<?Buffer>} Return buffer with data if EXPEDITED, else null
   */
  requestDownload(data) {
    let size;

    if (!data) {
      size = null;
    }

    if (data && data.length && !size) {
      size = data.length;
    }

    const { type, buffer } = this.buildRequestDownloadBuf(data, size);

    const validateResponse = (message) => {
      if (!message || (message && !message.sdoResponse)) {
        return false;
      }

      if (message.sdoResponse.command !== RESPONSE_DOWNLOAD) {
        return false;
      }

      if (message.sdoResponse.index !== this.index) {
        return false;
      }

      if (message.sdoResponse.subindex !== this.subindex) {
        return false;
      }

      return true;
    };

    return this.sdo.send(buffer, validateResponse)
      .then((message) => {
        if (type === 'expedited') {
          this.reset();
          return message;
        }

        throw new Error('Segmented download not implemented');
      });
  }

  /**
   * Public inteface to write data
   *
   * @param {Buffer} data
   *
   * @return {Promise}
   */
  write(data) {
    return this.requestDownload(data);
  }
}
