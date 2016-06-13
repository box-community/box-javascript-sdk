'use strict';
import BoxHttp from './box-http';
import Folders from './managers/folders';
import Files from './managers/files';
import WebLinks from './managers/web-links';
import BOX_CONSTANTS from './config/box-constants'

export default class BasicBoxClient {
  constructor(config) {
    config = config || {};
    this._baseApiUrl = config.baseUrl || "https://api.box.com/2.0"
    this._folders = new Folders(this);
    this._files = new Files(this);
    this._webLinks = new WebLinks(this);
    this._accessToken = this._checkTokenType(config);
    this._hasStoredAccessToken = (this._accessToken) ? true : false;
    this._returnsOnlyOptions = (config.noRequestMode && config.noRequestMode === true) ? true : false;
  }

  get folders() {
    return this._folders;
  }

  get files() {
    return this._files;
  }

  get webLinks() {
    return this._webLinks;
  }

  get accessToken() {
    return this._accessToken;
  }

  set accessToken(token) {
    this._accessToken = this._checkTokenType(token);
    this._hasStoredAccessToken = true;
  }

  _checkTokenType(token, removeFromOptions) {
    removeFromOptions = removeFromOptions || false;
    if (token && typeof token === 'string') {
      return token;
    }

    let foundToken;

    if (token && typeof token === 'object') {
      if (token.hasOwnProperty('accessToken')) {
        foundToken = token.accessToken;
        if (removeFromOptions) {
          delete token.accessToken;
        }
      }

      if (token.hasOwnProperty('access_token')) {
        foundToken = token.access_token;
        if (removeFromOptions) {
          delete token.access_token;
        }
      }
    }

    return foundToken;
  }

  _handleAuthorization(options, accessToken) {
    if (this._hasStoredAccessToken) {
      return this._constructHeaders(options, this._accessToken);
    } else if (accessToken) {
      return this._constructHeaders(options, accessToken);
    } else {
      let token = this._checkTokenType(options, true);
      return this._constructHeaders(options, token);
    }
  }

  _constructHeaders(options, accessToken) {
    let headers = {};
    if (accessToken) {
      headers[BOX_CONSTANTS.HEADER_AUTHORIZATION] = this._constructAuthorizationHeader(accessToken);
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  _constructAuthorizationHeader(accessToken) {
    return `${BOX_CONSTANTS.HEADER_AUTHORIZATION_PREFIX}${accessToken}`
  }

  _checkForEmptyObjects(options) {
    Object.keys(options).map((field) => {
      if(this._isEmpty(options[field])) {
        delete options[field];
      }
    });
  }

  _isEmpty(object) {
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }

  _applyFields(options) {
    options.params = options.params || {};
    if(options.fields) {
      options.params.fields = options.fields;
      delete options.fields;
    }
    return options.params;
  }

  makeRequest(path, options) {
    options = options || {};
    options.url = options.url || `${this._baseApiUrl}${path}`;
    options.headers = this._handleAuthorization(options);
    options.params = this._applyFields(options);
    this._checkForEmptyObjects(options);
    if (this._returnsOnlyOptions) {
      return options;
    }
    return BoxHttp(options);
  }

  revokeAuthAndRerunRequest(options, accessToken, setAsNewAccessToken) {
    setAsNewAccessToken = setAsNewAccessToken || false;
    if (options.setAsNewAccessToken) {
      setAsNewAccessToken = options.setAsNewAccessToken;
      delete options.setAsNewAccessToken;
    }

    if (!accessToken) {
      accessToken = this._checkTokenType(options, true);
    }

    if (options.headers && options.headers[BOX_CONSTANTS.HEADER_AUTHORIZATION]) {
      delete options.headers[BOX_CONSTANTS.HEADER_AUTHORIZATION];
    }

    this.removeAccessToken();

    if (setAsNewAccessToken) {
      this._accessToken = accessToken;
      this._hasStoredAccessToken = true;
    }

    options.headers = this._handleAuthorization(options, accessToken);
    return BoxHttp(options);
  }

  removeAccessToken() {
    this._accessToken = null;
    this._hasStoredAccessToken = false;
  }
}