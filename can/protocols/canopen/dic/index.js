import { readFileSync } from 'fs';
import parsers from './parsers';

/**
 * Parse eds content & return function ti create ObjectDic instance
 *
 * @param {String} content
 *
 * @return {Function}
 */
export function loadEds(content) {
  return () => parsers.eds.parse(content);
}

/**
 * Parse an eds file content
 *
 * @param {String} The eds file path
 *
 * @return {Function}
 */
export function loadEdsFile(path) {
  const content = readFileSync(path, 'utf8');
  return loadEds(content);
}
