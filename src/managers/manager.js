'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import InvestigateModes from '../util/investigate-modes';
import MapValues from '../util/map-values';
import FlattenDotProps from '../util/flatten-dotted-property-names';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';

const MODEL_VALUES = {
  SHARED_LINK: 'shared_link',
  SHARED_LINK_ACCESS: 'shared_link.access',
  UNSHARED_AT: 'shared_link.unshared_at',
  PERMISSIONS: 'shared_link.permissions',
  CAN_DOWNLOAD: 'shared_link.permissions.can_download',
  CAN_PREVIEW: 'shared_link.permissions.can_preview'
}

export default class Manager {
  constructor(client, values) {
    this.client = client;
    this.ALL_VALUES = (values) ? MapValues(values) : null;
    this.FLATTENED_VALUES = (this.ALL_VALUES) ? FlattenDotProps(this.ALL_VALUES) : null;
  }

  _getModel(options, values, skipValidation, ignoreModelValues) {
    if (options.body) {
      if (!skipValidation) { VerifyRequiredValues(options.body, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options.body, this.FLATTENED_VALUES); }
    } else if (options) {
      if (!skipValidation) { VerifyRequiredValues(options, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options, this.FLATTENED_VALUES); }
      options.body = CreateRequestBody(options, this.ALL_VALUES, ignoreModelValues);
    } else {
      values = values || this.ALL_VALUES;
      let requiredValuesString = values.join(', ');
      throw new Error(`Please select from the following fields when making this API call: ${requiredValuesString}`);
    }
  }

  _objectifyString(options) {
    if (typeof options === 'string') {
      let id = options;
      options = { id: id };
    }
    return options;
  }

  _getId(options) {
    let id = '';
    if (options.id) {
      id = options.id;
      delete options.id;
    } else if (typeof options === 'string') {
      id = options;
      options = {};
    }
    return id;
  }

  _getFolderId(options) {
    let folderId = this._getId(options);
    if (options.folderId || options.folder_id) {
      folderId = options.folderId || options.folder_id;
      (options.folderId) ? delete options.folderId : delete options.folder_id;
    } else if (options.folder && options.folder.id) {
      folderId = options.folder.id;
    }
    this._testForMissingId(folderId, BOX_CONSTANTS.FOLDER, BOX_CONSTANTS.FOLDER_ID);
    return folderId;
  }

  _getFileId(options) {
    let fileId = this._getId(options);
    if (options.fileId || options.file_id) {
      fileId = options.fileId || options.file_id;
      (options.fileId) ? delete options.fileId : delete options.file_id;
    } else if (options.file && options.file.id) {
      fileId = options.file.id;
    }
    this._testForMissingId(fileId, BOX_CONSTANTS.FILE, BOX_CONSTANTS.FILE_ID);
    return fileId;
  }

  _getScope(options) {
    let scope = 'enterprise';
    if (options.scope && options.scope !== '') {
      scope = options.scope;
      delete options.scope;
    }
    return scope;
  }

  _getTemplateKey(options) {
    let templateKey = '';
    if (options.template && options.template !== '') {
      templateKey = (options.template.key !== '') ? options.template.key : options.template;
      delete options.template;
    } else if (options.templateKey || options.template_key) {
      templateKey = options.templateKey || options.template_key;
      (options.templateKey) ? delete options.templateKey : delete options.template_key;
    }
    return templateKey;
  }

  _testForMissingId(id, idType, correctlyFormattedIdProp) {
    idType = idType || 'unknown';
    correctlyFormattedIdProp = correctlyFormattedIdProp || 'unknown';
    if (id === '') {
      throw new Error(`A(n) ${idType} field is required for this API call. Please provide an object with a key formatted in this style: ${correctlyFormattedIdProp}`);
    }
  }

  _setSkipValidation(options) {
    return InvestigateModes(options, BOX_CONSTANTS.MODES.SKIP_VALIDATION) || false;
  }

  _setIgnoreModelValues(options) {
    return InvestigateModes(options, BOX_CONSTANTS.MODES.IGNORE_MODEL_VALUES) || false;
  }

  _createSharedLink(options, id, BASE_PATH, FLATTENED_VALUES) {
    options = options || {};
    options.body = options.body || {};
    options.body.shared_link = options.body.shared_link || {};

    if (!this.client._simpleMode) {
      let skipValidation = this._setSkipValidation(options);
      let ignoreModelValues = this._setIgnoreModelValues(options);

      if (!ignoreModelValues) { NormalizeObjectKeys(options, FLATTENED_VALUES); }
      if (!skipValidation) {
        if (options[MODEL_VALUES.SHARED_LINK]) {
          options.body[MODEL_VALUES.SHARED_LINK] = options[MODEL_VALUES.SHARED_LINK];
          delete options[MODEL_VALUES.SHARED_LINK];
        }
      }
    }
    let apiPath = `${BASE_PATH}/${id}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }
}