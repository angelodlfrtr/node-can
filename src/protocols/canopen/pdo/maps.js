import PdoMap from './map';

export default class PdoMaps {
  /**
   * @constructor
   *
   * @param {Integer} comOffset
   * @param {Integer} mapOffset
   * @param {PdoNode} pdoNode
   */
  constructor(comOffset, mapOffset, pdoNode) {
    this.maps = {};

    for (let i = 0; i < 32; i += 1) {
      const idx = comOffset + i;

      if (pdoNode.node.objectDic.find(idx)) {
        const comSdo = pdoNode.node.objectDic.find(comOffset + i).bindSDO(pdoNode.node.sdo);
        const mapSdo = pdoNode.node.objectDic.find(mapOffset + i).bindSDO(pdoNode.node.sdo);

        this.maps[i + 1] = new PdoMap(pdoNode, comSdo, mapSdo);
      }
    }
  }

  /**
   * Find a map by DicVariables names in this given map
   *
   * @return {PdoMap}
   */
  findByName(name) {
    let res = null;

    Object.keys(this.maps).forEach((k) => {
      const map = this.maps[k];

      map.map.forEach((dicVar) => {
        if (dicVar && dicVar.name && dicVar.name === name) {
          res = map;
        }
      });
    });

    return res;
  }

  /**
   * Find a map by index
   *
   * @param {Integer} index
   *
   * @return {PdoMap}
   */
  find(index) {
    return this.maps[index];
  }
}
