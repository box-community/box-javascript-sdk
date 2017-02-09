'use strict';
export default () => {
  return ((window && window.FormData) || FormData) ? true : false;
}