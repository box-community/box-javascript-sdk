'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';
import MapAllRequiredValues from '../util/map-all-required-values';
const BASE_PATH = '/folders';
const REQUIRED_VALUES = {
  NAME: 'name',
  PARENT: 'parent',
  ID: 'parent.id'
}

export default class Folders {
  constructor(client) {
    this.client = client;
    this.ALL_REQUIRED_VALUES = MapAllRequiredValues(REQUIRED_VALUES);
  }

  _getFolderId(options) {
    let folderId;
    if (options.folderId) {
      folderId = options.folderId;
      delete options.folderId;
    } else if (options.file && options.file.id) {
      folderId = options.folder.id;
    } else if (typeof options === 'string') {
      folderId = options;
    } else {
      throw new Error('A folderId is required for this API call.');
    }
    return folderId;
  }

  _getFolder(options, values, skipValidation) {
    if (options.folder) {
      if (!skipValidation) { VerifyRequiredValues(options.folder, values) };
      options.body = CreateRequestBody(options.folder, values);
      delete options.folder;
    } else if (options.body) {
      if (!skipValidation) { VerifyRequiredValues(options.body, values) };
    } else if (options) {
      if (!skipValidation) { VerifyRequiredValues(options, values) };
      options.body = CreateRequestBody(options, values);
    } else {
      values = values || this.ALL_REQUIRED_VALUES;
      let requiredValuesString = values.join(', ');
      throw new Error(`The following values are required: ${requiredValuesString}`);
    }
  }

  get(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    let apiPath = `${BASE_PATH}/${folderId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getItems(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    let apiPath = `${BASE_PATH}/${folderId}/items`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getCollaborations(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    let apiPath = `${BASE_PATH}/${folderId}/collaborations`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getTrashedItems(options) {
    options = options || {};
    let apiPath = `${BASE_PATH}/trash/items`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getTrashedFile(options) {
    options = options || {};
    let folderId = this._getFolderId(options);

    let apiPath = `${BASE_PATH}/${folderId}/trash`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  create(options) {
    options = options || {};
    options.skipValidation = options.skipValidation || false;
    this._getFolder(options, this.ALL_REQUIRED_VALUES, options.skipValidation);
    delete options.skipValidation;
    let apiPath = `${BASE_PATH}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  update(options) {
    options = options || {};
    options.skipValidation = options.skipValidation || false;
    let folderId = this._getFolderId(options);
    this._getFolder(options, [], options.skipValidation);
    delete options.skipValidation;
    let apiPath = `${BASE_PATH}/${folderId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  copy(options) {
    options = options || {};
    options.skipValidation = options.skipValidation || false;
    let folderId = this._getFolderId(options);
    this._getFolder(options, [REQUIRED_VALUES.PARENT, REQUIRED_VALUES.ID], options.skipValidation);
    delete options.skipValidation;

    if (options.name) {
      options.body.name = options.name;
      delete options.name;
    } else if (options.newName) {
      options.body.name = options.newName;
      delete options.newName;
    }

    let apiPath = `${BASE_PATH}/${folderId}/copy`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  createSharedLink(options) {
    options = options || {};
    options.body = options.body || {};
    let folderId = this._getFolderId(options);

    if (options.shared_link) {
      options.body.shared_link = options.shared_link;
      delete options.shared_link;
    } else {
      options.body.shared_link = options.body.shared_link || {};
    }

    let apiPath = `${BASE_PATH}/${folderId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  restore(options) {
    options = options || {};
    options.skipValidation = options.skipValidation || false;
    let folderId = this._getFolderId(options);

    this._getFolder(options, [], options.skipValidation);
    delete options.skipValidation;

    let apiPath = `${BASE_PATH}/${folderId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  delete(options) {
    options = options || {};
    options.params = options.params || {};
    options.params.recursive = options.params.recursive || true;
    let folderId = this._getFolderId(options);

    let apiPath = `${BASE_PATH}/${folderId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }

  permanentlyDelete(options) {
    options = options || {};
    let folderId = this._getFolderId(options);

    let apiPath = `${BASE_PATH}/${folderId}/trash`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }
}