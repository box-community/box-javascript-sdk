'use strict';
export default () => {
  return ((window && window.FileReader) || FileReader) ? true : false;
}