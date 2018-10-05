import * as ini from 'ini';
import ObjectDic, {
  DicVariable,
  DicArray,
  DicRecord,
} from '../object_dic';

const VAR = 0x07;
const ARR = 0x08;
const RECORD = 0x09;

/**
 * Build DicVariable form section raw object
 *
 * @param {Integer} index
 * @param {Object} section
 * @param {Integer} subindex
 *
 * @return {DicVariable}
 */
function buildVariable(index, section, subindex = 0) {
  const name = section.ParameterName;
  const dicVar = new DicVariable(name, index, subindex);

  dicVar.dataType = parseInt(section.DataType, 16);
  dicVar.accessType = section.AccessType.toLowerCase();

  if (dicVar.dataType > 0x1B) {
    const dTypeStr = parseInt(dicVar.dataType, 16).toString();
    dicVar.dataType = parseInt(section[`${dTypeStr}sub1`].DefaultValue, 16);
  }

  if (section.LowLimit) {
    dicVar.min = parseInt(section.LowLimit, 16);
  }

  if (section.HighLimit) {
    dicVar.max = parseInt(section.HighLimit, 16);
  }

  if (section.DefaultValue) {
    dicVar.default = parseInt(section.DefaultValue, 16);
  }

  return dicVar;
}

export function parse(content) {
  const iniParsed = ini.parse(content);
  const dic = new ObjectDic();

  if (iniParsed.DeviceComissioning) {
    dic.nodeId = parseInt(iniParsed.DeviceComissioning.NodeId, 16) || null;
    dic.bitrate = parseInt(iniParsed.DeviceComissioning.Baudrate, 16) * 1000 || null;
  }

  Object.keys(iniParsed).forEach((sectionName) => {
    // Match indexs
    if (/^[0-9A-Fa-f]{4}$/.test(sectionName)) {
      const section = iniParsed[sectionName];
      const index = parseInt(sectionName, 16);
      const name = section.ParameterName;
      const objectType = parseInt(section.ObjectType, 0);

      if (objectType === VAR) {
        const variable = buildVariable(index, section);
        return dic.addObject(variable);
      }

      if (objectType === ARR) {
        const dicArr = new DicArray(name, index);
        return dic.addObject(dicArr);
      }

      if (objectType === RECORD) {
        const dicRecord = new DicRecord(name, index);
        return dic.addObject(dicRecord);
      }

      return sectionName;
    }

    // Match sub-indexs
    if (/^([0-9A-Fa-f]{4})sub([0-9A-Fa-f]+)$/.test(sectionName)) {
      const section = iniParsed[sectionName];
      const index = parseInt(sectionName.substring(0, 4), 16);
      const subIndex = parseInt(sectionName.substring(7), 16);
      const entry = dic.find(index);

      if (entry instanceof DicArray || entry instanceof DicRecord) {
        const dicVar = buildVariable(index, section, subIndex);
        entry.addMember(dicVar);
      }

      return sectionName;
    }

    return sectionName;
  });

  return dic;
}

export default parse;
