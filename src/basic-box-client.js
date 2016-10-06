'use strict';
import BaseBoxClient from './base-box-client';
import BoxHttp from './box-http';
import BOX_CONSTANTS from './config/box-constants'

export default class BasicBoxClient extends BaseBoxClient {
  constructor(config) {
    config = config || {};
    super(config);
  }

  makeRequest(path, options) {
    options = options || {};
    options.url = options.url || `${this._baseApiUrl}${path}`;
    options.headers = super._handleAuthorization(options);
    options.params = super._applyFields(options);
    super._checkForEmptyObjects(options);
    if (this._returnsOnlyOptions) {
      if (options.upload) { delete options.upload; }
      return options;
    }
    return BoxHttp(options);
  }

  removeAccessTokenAndRerunRequest(options, accessToken, setAsNewAccessToken) {
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