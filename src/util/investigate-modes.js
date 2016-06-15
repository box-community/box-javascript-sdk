'use strict';
import MapValues from './map-values';
import BOX_CONSTANTS from '../config/box-constants';

const MODE_VALUES = MapValues(BOX_CONSTANTS.MODES);

export default (options, mode) => {
  let runMode;
  if(MODE_VALUES.indexOf(mode) !== -1) {
    runMode = options[mode];
    delete options[mode];
  }
  return runMode;
}