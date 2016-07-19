'use strict';
export default function BoxHttp(options) {
  let promise = new Promise(function (resolve, reject) {

    let client = new XMLHttpRequest();
    let uri = options.url;
    let method = options.method;

    if (options.params) {
      uri += '?';
      uri += Object.keys(options.params).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(options.params[key]);
      }).join('&');
    }

    client.open(method, uri);

    if (options.headers) {
      Object.keys(options.headers).forEach((key) => {
        client.setRequestHeader(key, options.headers[key]);
      });
    }

    if (options.body && typeof options.body === 'object' && Object.prototype.toString.call(options.body) !== '[object FormData]') {
      client.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      client.send(JSON.stringify(options.body));

    } else if (options.body) {
      client.send(options.body);
    } else {
      client.send();
    }

    client.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(this.response);
      } else {
        let error = {
          statusText: this.statusText,
          status: this.status,
          responseText: this.responseText,
          options: options
        }
        reject(error);
      }
    };

    client.onerror = function () {
      let error = {
        statusText: this.statusText,
        status: this.status,
        responseText: this.responseText,
        options: options
      }
      reject(error);
    };
  });

  return promise;
}
