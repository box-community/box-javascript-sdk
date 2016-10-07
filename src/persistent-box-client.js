'use strict';
import BaseBoxClient from './base-box-client';
import BoxHttp from './box-http';
import BOX_CONSTANTS from './config/box-constants';

export default class PersistentBoxClient extends BaseBoxClient {
  constructor(config) {
    config = config || {};
    super(config);
    this._tokenExpirationTime = config.tokenExpirationTime || 3000000;
    this.accessTokenHandler = this._checkConfigForAccessTokenHandler(config);
    this.accessTokenStore = this._checkConfigForAccessTokenStore(config);
  }

  _checkConfigForAccessTokenHandler(config) {
    if (typeof config === "object" && (config.accessTokenHandler || config.access_token_handler)) {
      config.accessTokenObject = config.accessTokenHandler || config.access_token_handler;
      return this._promisifyAccessTokenHandler(config.accessTokenObject);
    } else {
      throw new Error("An accessTokenHandler is required to create a PersisentBoxClient. Please provide a callback function or promise that resolves to an access token");
    }
  }

  _checkConfigForAccessTokenStore(config) {
    if (typeof config === "object" && (config.accessTokenStore || config.access_token_store)) {
      config.accessTokenStore = config.accessTokenStore || config.access_token_store;
      return config.accessTokenStore;
    } else {
      return this._defaultAccessTokenStore(config);
    }
  }

  _findAccessTokenOnConfig(config) {
    if (typeof config === "object" && (config.initialAccessToken || config.initial_access_token)) {
      return config.initialAccessToken || config.initial_access_token;
    } else {
      return null;
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
    if (typeof accessTokenHandler === 'object' && 'then' in accessTokenHandler) {
      return accessTokenHandler
    } else if (typeof accessTokenHandler === 'function') {
      return new Promise((resolve, reject) => {
        return accessTokenHandler((err, token) => {
          if (err) { reject(err); }
          if (token) {
            resolve(token);
          } else {
            reject("Couldn't retrieve a new token.");
          }
        });
      });
    } else {
      throw new Error("accessTokenHandler must be a function or promise");
    }
  }

  _handlePersistentAuthorization(options) {
    let headers = options.headers || {};
    return this.accessTokenStore.accessToken
      .then((token) => {
        console.log("Token Object: ");
        console.log(token);
        if ((token && token.expires_at < Date.now()) || (token && token.expiresAt < Date.now()) || this._isTokenExpired) {
          this.refreshAccessToken();
          this._handlePersistentAuthorization(options);
        } else if (token && (token.access_token || token.accessToken)) {
          return new Promise((resolve, reject) => {
            headers[BOX_CONSTANTS.HEADER_AUTHORIZATION] = `Bearer ${token.accessToken}`;
            resolve(headers);
          });
        } else {
          throw new Error("Couldn't retrieve a new token.");
        }
      });
  }

  _defaultAccessTokenStore(config) {
    this._accessToken = {};
    this._isTokenExpired = true;

    this._init = (config) => {
      let token = (!this._isEmpty(config)) ? this._findAccessTokenOnConfig(config) : null;
      if (token) {
        this.setAccessToken(token);
      } else {
        this.refreshAccessToken();
      }
    }

    this.setAccessToken = (token) => {
      this._accessToken = new Promise((resolve, reject) => {
        this._isTokenExpired = false;
        resolve(this._verifyAccessTokenObject(token));
      })
    }

    this.getAccessToken = () => {
      return this._accessToken;
    }

    this.removeAccessToken = () => {
      this._accessToken = new Promise((resolve, reject) => {
        resolve(null);
      });
      this._isTokenExpired = true;
    }

    this.refreshAccessToken = () => {
      this._accessToken = this.accessTokenHandler
        .then((token) => {
          this._isTokenExpired = false;
          return this._verifyAccessTokenObject(token);
        });
    }

    this._init(config);

    return {
      accessToken: this.getAccessToken(),
      setAccessToken: this.setAccessToken,
      removeAccessToken: this.removeAccessToken,
      refreshAccessToken: this.refreshAccessToken
    }
  }

  retryRequest(options) {

  }

  makeRequest(path, options) {
    return new Promise((resolve, reject) => {
      this._handlePersistentAuthorization(options)
        .then((headers) => {
          options = options || {};
          options.url = options.url || `${this._baseApiUrl}${path}`;
          options.headers = headers;
          options.params = this._applyFields(options);
          this._checkForEmptyObjects(options);
          if (this._returnsOnlyOptions) {
            if (options.upload) { delete options.upload; }
            return options;
          }
          resolve(BoxHttp(options));
        });
    });
  }
}
