export default class DicArray {
  /**
   * @constructor
   *
   * @param {String} name
   * @param {Integer} index
   */
  constructor(name, index) {
    this.description = '';
    this.index = index;
    this.name = name;
    this.subindices = {};
    this.names = {};
  }

  /**
   * Set sdo in DicVariable in subindices
   *
   * @param {SdoClient} sdo
   *
   * @return {DicArray} this
   */
  bindSDO(sdo) {
    Object.keys(this.subindices).forEach((k) => {
      this.subindices[k].sdo = sdo;
    });

    return this;
  }

  /**
   * Add a variable member to array
   *
   * @param {DicVariable} variable
   *
   * @return void
   */
  addMember(variable) {
    this.subindices[variable.subindex] = variable;
    this.names[variable.name] = variable;
  }
}
