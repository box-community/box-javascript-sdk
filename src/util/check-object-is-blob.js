'use strict';
export default (blob) => {
  return (blob.constructor === Blob && blob instanceof Blob) ? true : false;
}