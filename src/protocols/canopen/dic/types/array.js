import DicEntity from './entity';

export default class DicArray extends DicEntity {
  /**
   * @constructor
   *
   * @param {String} name
   * @param {Integer} index
   */
  constructor(name, index) {
    super();

    this.description = '';
    this.index = index;
    this.name = name;
    this.subindices = {};
    this.names = {};
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
