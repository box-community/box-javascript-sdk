'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import Manager from './manager';

const BASE_PATH = '/folders';
const MODEL_VALUES = {
  NAME: 'name',
  PARENT: 'parent',
  ID: 'parent.id',
  DESCRIPTION: 'description',
  SHARED_LINK: 'shared_link',
  SHARED_LINK_ACCESS: 'shared_link.access',
  UNSHARED_AT: 'shared_link.unshared_at',
  PASSWORD: 'shared_link.password',
  PERMISSIONS: 'shared_link.permissions',
  CAN_DOWNLOAD: 'shared_link.permissions.can_download',
  CAN_PREVIEW: 'shared_link.permissions.can_preview',
  FOLDER_UPLOAD_EMAIL: 'folder_upload_email',
  FOLDER_UPLOAD_EMAIL_ACCESS: 'folder_upload_email.access',
  OWNED_BY: 'owned_by',
  OWNED_BY_ID: 'owned_by.id',
  SYNC_STATE: 'sync_state',
  TAGS: 'tags'
}

export default class Folders extends Manager {
  constructor(client) {
    super(client, MODEL_VALUES);
  }

  _getFolderId(options) {
    let folderId = super._getId(options);
    if (options.folderId || options.folder_id) {
      folderId = options.folderId || options.folder_id;
      (options.folderId) ? delete options.folderId : delete options.folder_id;
    } else if (options.folder && options.folder.id) {
      folderId = options.folder.id;
    }
    super._testForMissingId(folderId);
    return folderId;
  }

  _getFolder(options, values, skipValidation, ignoreModelValues) {
    skipValidation = skipValidation || this.client.skipValidation || false;
    ignoreModelValues = ignoreModelValues || false;

    if (options.folder) {
      if (!skipValidation) { VerifyRequiredValues(options.folder, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options.folder, this.FLATTENED_VALUES); }
      options.body = CreateRequestBody(options.folder, this.ALL_VALUES, ignoreModelValues);
      delete options.folder;
    } else {
      super._getModel(options, values, skipValidation, ignoreModelValues);
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

  getMetadata(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH}/${folderId}/metadata/${scope}/${templateKey}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getAllMetadata(options) {
    options = options || {};
    let folderId = this._getFolderId(options);

    let apiPath = `${BASE_PATH}/${folderId}/metadata`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  create(options) {
    options = options || {};
    if (!this.client._simpleMode) {
      const REQUIRED_VALUES = [MODEL_VALUES.PARENT, MODEL_VALUES.ID, MODEL_VALUES.NAME];
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getFolder(options, REQUIRED_VALUES, skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_PATH}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  createMetadata(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH}/${folderId}/metadata/${scope}/${templateKey}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  update(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    if (!this.client._simpleMode) {
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getFolder(options, [], skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_PATH}/${folderId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  copy(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    if (!this.client._simpleMode) {
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getFolder(options, [REQUIRED_VALUES.PARENT, REQUIRED_VALUES.ID], skipValidation, ignoreModelValues);

      if (options.newName) {
        options.body.name = options.newName;
        delete options.newName;
      }
    }
    let apiPath = `${BASE_PATH}/${folderId}/copy`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  createSharedLink(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    return super._createSharedLink(options, folderId, BASE_PATH, this.FLATTENED_VALUES);
  }

  updateCollections(options) {
    options = options || {};
    let folderId = this._getFolderId(options);

    if (options.collections) {
      options.body.collections = options.collections;
      delete options.collections;
    }

    let apiPath = `${BASE_PATH}/${folderId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  restore(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    if (!this.client._simpleMode) {
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getFolder(options, [], skipValidation, ignoreModelValues);
    }
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

  deleteMetadata(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH}/${folderId}/metadata/${scope}/${templateKey}`;
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