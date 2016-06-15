'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';
import MapValues from '../util/map-values';
import InvestigateModes from '../util/investigate-modes';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import FlattenDotProps from '../util/flatten-dotted-property-names';

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
  PERMISSIONS: 'permissions',
  CAN_DOWNLOAD: 'permissions.can_download',
  CAN_PREVIEW: 'permissions.can_preview',
  FOLDER_UPLOAD_EMAIL: 'folder_upload_email',
  FOLDER_UPLOAD_EMAIL_ACCESS: 'folder_upload_email.access',
  OWNED_BY: 'owned_by',
  OWNED_BY_ID: 'owned_by.id',
  SYNC_STATE: 'sync_state',
  TAGS: 'tags'
}

export default class Folders {
  constructor(client) {
    this.client = client;
    this.ALL_VALUES = MapValues(MODEL_VALUES);
    this.FLATTENED_VALUES = FlattenDotProps(this.ALL_VALUES);
  }

  _getFolderId(options) {
    let folderId;
    if (options.folderId || options.folder_id) {
      folderId = options.folderId || options.folder_id;
      (options.folderId) ? delete options.folderId : delete options.folder_id;
    } else if (options.folder && options.folder.id) {
      folderId = options.folder.id;
    } else if (typeof options === 'string') {
      folderId = options;
    } else {
      throw new Error('A folderId is required for this API call.');
    }
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
    } else if (options.body) {
      if (!skipValidation) { VerifyRequiredValues(options.body, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options.body, this.FLATTENED_VALUES); }
    } else if (options) {
      console.log("HERE!");
      console.log(ignoreModelValues);
      if (!skipValidation) { VerifyRequiredValues(options, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options, this.FLATTENED_VALUES); }
      console.log(options);
      options.body = CreateRequestBody(options, this.ALL_VALUES, ignoreModelValues);
    } else {
      values = values || this.ALL_VALUES;
      let requiredValuesString = values.join(', ');
      throw new Error(`Please select from the following fields when making this API call: ${requiredValuesString}`);
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
    if (!this.client._simpleMode) {
      const REQUIRED_VALUES = [MODEL_VALUES.PARENT, MODEL_VALUES.ID, MODEL_VALUES.NAME];
      let skipValidation = InvestigateModes(options, BOX_CONSTANTS.MODES.SKIP_VALIDATION) || false;
      let ignoreModelValues = InvestigateModes(options, BOX_CONSTANTS.MODES.IGNORE_MODEL_VALUES) || false;

      this._getFolder(options, REQUIRED_VALUES, skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_PATH}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  update(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    if (!this.client._simpleMode) {
      let skipValidation = InvestigateModes(options, BOX_CONSTANTS.MODES.SKIP_VALIDATION) || false;
      let ignoreModelValues = InvestigateModes(options, BOX_CONSTANTS.MODES.IGNORE_MODEL_VALUES) || false;

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
      let skipValidation = InvestigateModes(options, BOX_CONSTANTS.MODES.SKIP_VALIDATION) || false;
      let ignoreModelValues = InvestigateModes(options, BOX_CONSTANTS.MODES.IGNORE_MODEL_VALUES) || false;

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
    options.body = options.body || {};
    options.body.shared_link = options.body.shared_link || {};
    let folderId = this._getFolderId(options);
    if (!this.client._simpleMode) {
      let skipValidation = InvestigateModes(options, BOX_CONSTANTS.MODES.SKIP_VALIDATION) || false;
      let ignoreModelValues = InvestigateModes(options, BOX_CONSTANTS.MODES.IGNORE_MODEL_VALUES) || false;

      if (!ignoreModelValues) { NormalizeObjectKeys(options, this.FLATTENED_VALUES); }
      if (!skipValidation) {
        if (options[MODEL_VALUES.SHARED_LINK]) {
          options.body[MODEL_VALUES.SHARED_LINK] = options[MODEL_VALUES.SHARED_LINK];
          delete options[MODEL_VALUES.SHARED_LINK];
        }

        if (options[MODEL_VALUES.PERMISSIONS]) {
          options.body[MODEL_VALUES.PERMISSIONS] = options[MODEL_VALUES.PERMISSIONS];
          delete options[MODEL_VALUES.PERMISSIONS];
        }
      }
    }
    let apiPath = `${BASE_PATH}/${folderId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  restore(options) {
    options = options || {};
    let folderId = this._getFolderId(options);
    if (!this.client._simpleMode) {
      let skipValidation = InvestigateModes(options, BOX_CONSTANTS.MODES.SKIP_VALIDATION) || false;
      let ignoreModelValues = InvestigateModes(options, BOX_CONSTANTS.MODES.IGNORE_MODEL_VALUES) || false;

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

  permanentlyDelete(options) {
    options = options || {};
    let folderId = this._getFolderId(options);

    let apiPath = `${BASE_PATH}/${folderId}/trash`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }
}