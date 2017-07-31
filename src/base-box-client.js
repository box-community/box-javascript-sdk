import Folders from './managers/folders';
import Files from './managers/files';
import WebLinks from './managers/web-links';
import Collaborations from './managers/collaborations';
import Collections from './managers/collections';
import Comments from './managers/comments';
import Groups from './managers/groups';
import Metadata from './managers/metadata';
import Search from './managers/search';
import Tasks from './managers/tasks';
import Users from './managers/users';
import BOX_CONSTANTS from './config/box-constants'
import BoxHttp from './box-http';

export default class BaseBoxClient {
  constructor(config) {
    this._folders = new Folders(this);
    this._files = new Files(this);
    this._webLinks = new WebLinks(this);
    this._collaborations = new Collaborations(this);
    this._collections = new Collections(this);
    this._comments = new Comments(this);
    this._groups = new Groups(this);
    this._metadata = new Metadata(this);
    this._search = new Search(this);
    this._tasks = new Tasks(this);
    this._users = new Users(this);
    this._baseApiUrl = config.baseUrl || "https://api.box.com/2.0";
    this._returnsOnlyOptions = (config.hasOwnProperty('noRequestMode') && config.noRequestMode === true) ? true : false;
    this._skipValidation = (config.hasOwnProperty('skipValidation') && config.skipValidation === true) ? true : false;
    this._simpleMode = (config.hasOwnProperty('simpleMode') && config.simpleMode === true) ? true : false;
    this._accessToken = this._checkTokenType(config);
    this._hasStoredAccessToken = (this._accessToken) ? true : false;

    this.httpService = config.httpService || BoxHttp;
    this.Promise = config.Promise || Promise;
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

  get collaborations() {
    return this._collaborations;
  }

  get collections() {
    return this._collections;
  }

  get comments() {
    return this._comments;
  }

  get groups() {
    return this._groups;
  }

  get metadata() {
    return this._metadata;
  }

  get search() {
    return this._search;
  }

  get tasks() {
    return this._tasks;
  }

  get users() {
    return this._users;
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
    if (accessToken) {
      return this._constructHeaders(options, accessToken);
    }

    if (options && options.accessToken || options.access_token) {
      let accessToken = options.accessToken || options.access_token;
      (options.accessToken) ? delete options.accessToken : delete options.access_token;
      return this._constructHeaders(options, accessToken);
    } else if (this._hasStoredAccessToken) {
      return this._constructHeaders(options, this._accessToken);
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
      if (field !== "body" && field !== "upload" && field !== "chunkedUpload" && field !== "useXHR" && field !== "returnCancelToken" && field !== "returnsOnlyOptions" && this._isEmpty(options[field])) {
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
    if (options.fields) {
      options.params.fields = options.fields;
      delete options.fields;
    }
    return options.params;
  }

  _formatOptions(options) {
    if (options.chunkedUpload) {
      return options;
    }

    let formattedOptions = {};
    (options.useXHR) ? formattedOptions.useXHR = true : null;
    (options.returnCancelToken) ? formattedOptions.returnCancelToken = true : null;
    let uri = options.url;

    if (options.params) {
      uri += '?';
      uri += Object.keys(options.params).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(options.params[key]);
      }).join('&');
    }
    formattedOptions.url = uri;
    formattedOptions.headers = options.headers;

    if (options.upload) {
      options.headers['Content-Type'] = "multipart/form-data";
      options.mode = 'cors';
      return options;
    }

    if (options.body && typeof options.body === 'object' && !options.upload) {
      formattedOptions.body = JSON.stringify(options.body);
      if (!formattedOptions.headers['Content-Type']) {
        formattedOptions.headers['Content-Type'] = "application/json;charset=UTF-8";
      }
    }

    formattedOptions.method = options.method;
    formattedOptions.data = options.body;
    formattedOptions.mode = 'cors';
    return formattedOptions;
  }

  _handleAngularFileUpload($http, options) {
    options.headers['Content-Type'] = undefined;
    return $http.post(options.url, options.body, {
      headers: options.headers
    });
  }
}