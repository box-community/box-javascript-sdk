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
    this.accessTokenStore = this._defaultAccessTokenStore();
    this.storage = config.storage || "localStorage";
    this.callback = config.callback || false;
    this.promise = config.promise || true;
    this.supportsStorage = this._storageAvailable(this.storage);
  }

  _checkConfigForAccessTokenHandler(config) {
    if (typeof config === "object" && (config.accessTokenHandler || config.access_token_handler)) {
      config.accessTokenObject = config.accessTokenHandler || config.access_token_handler;
      return config.accessTokenObject;
    } else {
      throw new Error("An accessTokenHandler is required to create a PersisentBoxClient. Please provide a callback function or promise that resolves to an access token");
    }
  }

  _storageAvailable(type) {
    try {
      var storage = window[type],
        x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    }
    catch (e) {
      return false;
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
    if (typeof accessTokenHandler === 'function' && this.callback) {
      return new Promise((resolve, reject) => {
        accessTokenHandler((err, token) => {
          if (err) { reject(err); }
          if (token) {
            resolve(token);
          } else {
            reject("Couldn't retrieve a new token.");
          }
        });
      });
    } else if (typeof accessTokenHandler === 'function' && this.promise) {
      let isPromise = accessTokenHandler();
      if (typeof isPromise === 'object' && 'then' in isPromise) {
        return isPromise;
      } else {
        throw new Error("accessTokenHandler must resolve to a function or promise");
      }
    } else {
      throw new Error("accessTokenHandler must resolve to a function or promise");
    }
  }

  _defaultAccessTokenStore() {
    this._accessToken = () => {
      if (this.supportsStorage) {
        let boxToken = window[this.storage].getItem(BOX_CONSTANTS.BOX_TOKEN_STORAGE_KEY);
        boxToken = (boxToken) ? JSON.parse(boxToken) : null;
        if (!boxToken || this._isExpired(boxToken)) {
          return new Promise((resolve, reject) => {
            return this._promisifyAccessTokenHandler(this.accessTokenHandler)
              .then((token) => {
                token = this._verifyAccessTokenObject(token)
                window[this.storage].setItem(BOX_CONSTANTS.BOX_TOKEN_STORAGE_KEY, JSON.stringify(token));
                resolve(token);
              });
          });
        } else {
          return new Promise((resolve, reject) => { resolve(this._verifyAccessTokenObject(boxToken)); });
        }
      } else {
        return new Promise((resolve, reject) => {
          return this._promisifyAccessTokenHandler(this.accessTokenHandler)
            .then((token) => {
              token = this._verifyAccessTokenObject(token)
              resolve(token);
            });
        });
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
