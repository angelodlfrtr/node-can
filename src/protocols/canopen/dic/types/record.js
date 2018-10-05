export default class DicRecord {
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
   * @return {DicRecord} this
   */
  bindSDO(sdo) {
    Object.keys(this.subindices).forEach((k) => {
      this.subindices[k].sdo = sdo;
    });

    return this;
  }

  /**
   * Add a variable member to record
   *
   * @param {DicVariable} variable
   *
   * @return void
   */
  addMember(variable) {
    this.subindices[variable.subindex] = variable;
    this.names[variable.name] = variable;
  }

  /**
   * Find a member by index
   *
   * @param {Integer} index
   *
   *  @return {DicVariable}
   */
  find(index) {
    return this.subindices[index.toString()];
  }

  /**
   * Find a member by name
   *
   * @param {String} name
   *
   * @return {DicVariable}
   */
  findByName(name) {
    return this.names[name];
  }

  /**
   * @cloneFunc findByName
   */
  get(name) {
    return this.findByName(name);
  }
}
