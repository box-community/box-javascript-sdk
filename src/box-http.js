'use strict';
import Axios from 'axios';

export default function BoxHttp(options) {
  if (options.upload) {
    return Axios.post(options.url, options.body, options)
      .then(checkStatus)
      .catch(checkStatus);
  }
  return Axios(options.url, options)
    .then(checkStatus)
    .catch(checkStatus);

  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      delete options.mode;
      (response.message) ? response.message : "Network Error";
      var error = new Error(response.message);
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = response;
      error.options = options;
      throw error;
    }
  }
}
