'use strict';
import BaseBoxClient from './base-box-client';
import BOX_CONSTANTS from './config/box-constants'

export default class BasicBoxClient extends BaseBoxClient {
  constructor(config) {
    config = config || {};
    super(config);
  }

  makeRequest(path, options) {
    options = options || {};
    options.url = options.url || `${this._baseApiUrl}${path}`;
    options.headers = this._handleAuthorization(options);
    options.params = this._applyFields(options);
    this._checkForEmptyObjects(options);
    options = this._formatOptions(options);
    if (this._returnsOnlyOptions || options.returnsOnlyOptions) {
      if (options.upload) {
        options.headers["Content-Type"] = undefined;
        delete options.upload;
      }
      return options;
    } else if (this.httpService.defaults && options.upload) {
      return this._handleAngularFileUpload(this.httpService, options);
    } else {
      return this.httpService(options);
    }
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
      this.removeAccessToken();
      this._accessToken = this._checkTokenType(accessToken);
      this._hasStoredAccessToken = true;
    }

    options.headers = this._handleAuthorization(options, accessToken);
    options = this._formatOptions(options);
    return BoxHttp(options);
  }

  removeAccessToken() {
    this._accessToken = null;
    this._hasStoredAccessToken = false;
  }
}