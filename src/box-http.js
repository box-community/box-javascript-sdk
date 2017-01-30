'use strict';
import "whatwg-fetch";

export default function BoxHttp(options) {
  if (options.upload) {
    // Workaround for upload with Fetch library for now...
    // https://github.com/whatwg/fetch/issues/380
    return new Promise((resolve, reject) => {
      let client = new XMLHttpRequest();
      let uri = options.url;
      let method = options.method;

      client.open(method, uri, true);
      if (options.headers) {
        if (options.headers["Content-Type"]) {
          delete options.headers["Content-Type"];
        }
        Object.keys(options.headers).forEach((key) => {
          client.setRequestHeader(key, options.headers[key]);
        });
      }
      client.send(options.body);
      client.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(JSON.parse(this.response));
        } else {
          var error = new Error(this.statusText);
          error.response = this.response;
          reject(error);
        }
      }
      client.onerror = function () {
        var error = new Error(this.statusText);
        error.response = this.response;
        reject(error);
      }
    });
  } else {
    return fetch(options.url, options)
      .then(handleErrors)
      .then(parseJson);
  }
  function handleErrors(response) {
    if (!response.ok) {
      var error = new Error(response.statusText)
      error.response = response
      throw error;
    }
    return response;
  }

  function parseJson(response) {
    if (response.status !== 204) {
      return response.json();
    }
  }
}
