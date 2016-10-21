'use strict';
import BaseBoxClient from './base-box-client';
import BoxHttp from './box-http';
import BOX_CONSTANTS from './config/box-constants';

export default class PersistentBoxClient extends BaseBoxClient {
  constructor(config) {
    config = config || {};
    super(config);
    this._tokenExpirationTime = config.tokenExpirationTime || 2700000;
    this.accessTokenHandler = this._checkConfigForAccessTokenHandler(config);
  }

  _checkConfigForAccessTokenHandler(config) {
    if (typeof config === "object" && (config.accessTokenHandler || config.access_token_handler)) {
      config.accessTokenObject = config.accessTokenHandler || config.access_token_handler;
      return config.accessTokenObject;
    } else {
      throw new Error("An accessTokenHandler is required to create a PersisentBoxClient. Please provide a callback function or promise that resolves to an access token");
    }
  }

  _verifyAccessTokenObject(accessTokenObject) {
    let verifiedAccessTokenObject = {};
    if (typeof accessTokenObject === "string") {
      verifiedAccessTokenObject.accessToken = accessTokenObject;
      verifiedAccessTokenObject.expiresAt = this._calculateTokenExpiration();
      return verifiedAccessTokenObject;
    }
    if (typeof accessTokenObject === "object" && (accessTokenObject.accessToken || accessTokenObject.access_token)) {
      verifiedAccessTokenObject.accessToken = accessTokenObject.accessToken || accessTokenObject.access_token;
    }
    if (typeof accessTokenObject === "object" && (accessTokenObject.expiresAt || accessTokenObject.expires_at)) {
      verifiedAccessTokenObject.expiresAt = accessTokenObject.expiresAt || accessTokenObject.expires_at;
    }
    if (!verifiedAccessTokenObject.expiresAt) {
      verifiedAccessTokenObject.expiresAt = this._calculateTokenExpiration();
    }
    return verifiedAccessTokenObject;
  }

  _calculateTokenExpiration() {
    return Date.now() + this._tokenExpirationTime;
  }

  _promisifyAccessTokenHandler(accessTokenHandler) {
    var promiseOrCallback = accessTokenHandler();
    if (typeof promiseOrCallback === 'object' && 'then' in promiseOrCallback) {
      console.log("Found a promise...");
      return promiseOrCallback;
    } else if (typeof promiseOrCallback === 'function') {
      console.log("Creating a promise...");
      return new Promise((resolve, reject) => {
        promiseOrCallback((err, token) => {
          if (err) { reject(err); }
          if (token) {
            resolve(token);
          } else {
            reject("Couldn't retrieve a new token.");
          }
        });
      });
    } else {
      throw new Error("accessTokenHandler must resolve to a function or promise");
    }
  }

  _defaultAccessTokenStore() {
    this._accessToken = () => {
      let boxToken = localStorage.getItem(BOX_CONSTANTS.BOX_TOKEN_LOCAL_STORAGE_KEY);
      boxToken = (boxToken) ? JSON.parse(boxToken) : null;
      if (!boxToken || this._isExpired(boxToken)) {
        return new Promise((resolve, reject) => {
          return this._promisifyAccessTokenHandler(this.accessTokenHandler)
            .then((token) => {
              token = this._verifyAccessTokenObject(token)
              localStorage.setItem(BOX_CONSTANTS.BOX_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(token));
              resolve(token);
            });
        });
      } else {
        return new Promise((resolve, reject) => { resolve(this._verifyAccessTokenObject(boxToken)); });
      }
    }

    this._isExpired = (token) => {
      return (token.expiresAt < Date.now()) ? true : false;
    }

    return {
      accessToken: this._accessToken
    }
  }

  retryRequest(options) {

  }

  makeRequest(path, options) {
    return new Promise((resolve, reject) => {
      this.accessTokenStore.accessToken()
        .then((token) => {
          console.log("Finalized token: ");
          console.log(token);

          let headers = options.headers || {};
          headers[BOX_CONSTANTS.HEADER_AUTHORIZATION] = `Bearer ${token.accessToken}`;
          options = options || {};
          options.url = options.url || `${this._baseApiUrl}${path}`;
          options.headers = headers;
          options.params = this._applyFields(options);
          this._checkForEmptyObjects(options);
          if (this._returnsOnlyOptions) {
            if (options.upload) { delete options.upload; }
            resolve(options);
          } else {
            resolve(BoxHttp(options));
          }
        });
    });
  }
}
