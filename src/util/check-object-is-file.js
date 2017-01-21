'use strict';
export default (file) => {
  return (file.constructor === File && typeof file.name == 'string') ? true : false;
}