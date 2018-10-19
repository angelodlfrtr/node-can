export default class DicEntity {
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
}
