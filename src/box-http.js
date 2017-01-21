'use strict';
import "whatwg-fetch";

export default function BoxHttp(options) {
  if (options.upload) {
    options.headers["Content-Type"] = undefined;
    return fetch(options.url, options);
  }
  return fetch(options.url, options)
    .then(handleErrors)
    .then(parseJson);

  function handleErrors(response) {
    if (!response.ok) {
      var error = new Error(response.statusText)
      error.response = response
      throw error;
    }
    return response;
  }

  function parseJson(response) {
    return response.json();
  }
}
