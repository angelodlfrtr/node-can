const DESCRIPTIONS = [
  // Code, Mask,   Description
  [0x0000, 0xFF00, 'Error Reset / No Error'],
  [0x1000, 0xFF00, 'Generic Error'],
  [0x2000, 0xF000, 'Current'],
  [0x3000, 0xF000, 'Voltage'],
  [0x4000, 0xF000, 'Temperature'],
  [0x5000, 0xFF00, 'Device Hardware'],
  [0x6000, 0xF000, 'Device Software'],
  [0x7000, 0xFF00, 'Additional Modules'],
  [0x8000, 0xF000, 'Monitoring'],
  [0x9000, 0xFF00, 'External Error'],
  [0xF000, 0xFF00, 'Additional Functions'],
  [0xFF00, 0xFF00, 'Device Specific'],
];

export default class EmcyError extends Error {
  /**
   * @constructor
   *
   * @TODO not working
   */
  constructor(code, register, data, timestamp) {
    super(code);

    this.code = code;
    this.register = register;
    this.data = data;
    this.timestamp = timestamp;
  }

  getDesc(code) { // eslint-disable-line
    for (let i = 0; i < DESCRIPTIONS.length; i += 1) {
      const desc = DESCRIPTIONS[i];
      if ((desc[0] & desc[1]) === code) {
        return desc[2];
      }
    }

    return 'NC';
  }
}
