'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import Manager from './manager';
import generateMd5 from '../util/generate-md5';

const BASE_PATH = '/files';
const LOCK = 'lock';
const UPLOAD_PATH = 'https://upload.box.com/api/2.0';
const MODEL_VALUES = {
  NAME: 'name',
  PARENT: 'parent',
  ID: 'parent.id',
  DESCRIPTION: 'description',
  SHARED_LINK: 'shared_link',
  SHARED_LINK_ACCESS: 'shared_link.access',
  UNSHARED_AT: 'shared_link.unshared_at',
  PERMISSIONS: 'shared_link.permissions',
  CAN_DOWNLOAD: 'shared_link.permissions.can_download',
  CAN_PREVIEW: 'shared_link.permissions.can_preview',
  FOLDER_UPLOAD_EMAIL: 'folder_upload_email',
  FOLDER_UPLOAD_EMAIL_ACCESS: 'folder_upload_email.access',
  OWNED_BY: 'owned_by',
  OWNED_BY_ID: 'owned_by.id',
  SYNC_STATE: 'sync_state',
  TAGS: 'tags',
  SIZE: 'size'
}

const DIMENSION_VALUES = {
  MIN_HEIGHT: 'min_height',
  MAX_HEIGHT: 'max_height',
  MIN_WIDTH: 'min_width',
  MAX_WIDTH: 'max_width'
}

const DIMENSIONS = Object.keys(DIMENSION_VALUES).map((key) => { return DIMENSION_VALUES[key]; });

export default class Files extends Manager {
  constructor(client) {
    super(client, MODEL_VALUES);
  }

  _getVersionId(options) {
    let versionId;
    if (options.versionId || options.version_id) {
      versionId = options.versionId || options.version_id;
      (options.versionId) ? delete options.versionId : options.version_id;
    }
    super._testForMissingId(versionId, BOX_CONSTANTS.VERSION, BOX_CONSTANTS.VERSION_ID);
    return versionId;
  }

  _getFile(options, values, skipValidation, ignoreModelValues) {
    skipValidation = skipValidation || this.client.skipValidation || false;
    ignoreModelValues = ignoreModelValues || false;

    if (options.file) {
      if (!skipValidation) { VerifyRequiredValues(options.file, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options.file, this.FLATTENED_VALUES); }
      options.body = CreateRequestBody(options.file, this.ALL_VALUES, ignoreModelValues);
      delete options.file;
    } else {
      super._getModel(options, values, skipValidation, ignoreModelValues);
    }
  }

  get(options) {
    options = super._objectifyString(options) || {};
    let fileId = super._getFileId(options);
    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  // Currently not possible due to CORS
  // Need to implement your own server endpoint
  // and retrieve download redirect url.
  // download(options) {
  //   options.params = options.params || {};

  //   let versionId = options.versionId || '';
  //   if (versionId) {
  //     options.params.version = versionId;
  //   }

  //   let fileId = super._getFileId(options);

  //   let apiPath = `${BASE_PATH}/${fileId}/content`;
  //   options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
  //   return this.client.makeRequest(apiPath, options);
  // }

  getDownloadUrl(options) {
    options = super._objectifyString(options) || {};
    let fileId = super._getFileId(options);
    options.params = options.params || {};
    if (options.fields || options.params.fields) {
      options.params.fields = (options.params.fields) ? options.params.fields : options.fields;
      options.params.fields = options.params.fields.concat(',download_url');
    } else {
      options.params = {
        fields: "download_url"
      };
    }
    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  upload(options) {
    options = options || {};
    options.url = options.url || `${UPLOAD_PATH}/files/content`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    options.upload = true;
    return this.client.makeRequest(null, options);
  }

  // Be careful, this is an experimental and untested method.
  // Use at your own risk!
  uploadWithPreflightAndMd5(options) {
    var file = options.file;
    var formData = options.body;
    var decorateOptions = JSON.parse(JSON.stringify(options));
    return this.preflightCheck(options)
      .then((resp) => {
        if (resp.upload_url) {
          decorateOptions.url = resp.upload_url;
        }
        return;
      })
      .then(() => {
        if (file === undefined) {
          throw new Error("Couldn't access file...");
        }
        return generateMd5(file);
      })
      .then((md5) => {
        decorateOptions.headers = decorateOptions.headers || {};
        decorateOptions.body = formData;
        delete decorateOptions.file;
        decorateOptions.headers["Content-MD5"] = md5;
        return this.upload(decorateOptions);
      });
  }

  preflightCheck(options) {
    options = options || {};
    if (!this.client._simpleMode) {
      const REQUIRED_VALUES = [MODEL_VALUES.SIZE, MODEL_VALUES.NAME];
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getFile(options, REQUIRED_VALUES, skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_PATH}/content`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.OPTIONS;
    return this.client.makeRequest(apiPath, options);
  }

  update(options) {
    options = options || {};
    let fileId = super._getFileId(options);
    options.url = options.url || `${UPLOAD_PATH}/${fileId}/content`;
    this.upload(options);
  }

  getComments(options) {
    options = super._objectifyString(options) || {};
    let fileId = super._getFileId(options);
    let apiPath = `${BASE_PATH}/${fileId}/comments`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getTasks(options) {
    options = super._objectifyString(options) || {};
    let fileId = super._getFileId(options);
    let apiPath = `${BASE_PATH}/${fileId}/tasks`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getEmbedLink(options) {
    options = super._objectifyString(options) || {};
    let fileId = super._getFileId(options);

    options.params = options.params || {};
    if (options.fields || options.params.fields) {
      if (options.fields) {
        options.params.fields = options.fields;
        delete options.fields;
      }
      options.params.fields = options.params.fields.concat(',expiring_embed_link');
    } else {
      options.params.fields = 'expiring_embed_link';
    }

    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getVersions(options) {
    options = super._objectifyString(options) || {};
    let fileId = super._getFileId(options);

    let apiPath = `${BASE_PATH}/${fileId}/versions`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getThumbnail(options) {
    options = options || {};
    options.extension = options.extension || '.png';
    options.params = options.params || {};
    let fileId = super._getFileId(options);

    Object.keys(options).map((key) => {
      if (DIMENSIONS.indexOf(key) !== -1) {
        options.params[key] = options[key];
        delete options[key];
      }
    });

    let apiPath = `${BASE_PATH}/${fileId}/thumbnail${options.extension}`;
    delete options.extension;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getTrashedFile(options) {
    options = super._objectifyString(options) || {};
    let fileId = super._getFileId(options);

    let apiPath = `${BASE_PATH}/${fileId}/trash`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  createSharedLink(options) {
    options = options || {};
    let fileId = super._getFileId(options);
    return super._createSharedLink(options, fileId, BASE_PATH, this.FLATTENED_VALUES);
  }

  promoteVersion(options) {
    options = options || {};
    options.body = options.body || {};
    let fileId = super._getFileId(options);

    if (!options.body.id) {
      let versionId = this._getVersionId(options);
      options.body.id = versionId;
    }

    options.body.type = 'file_version';

    let apiPath = `${BASE_PATH}/${fileId}/versions/current`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  copy(options) {
    options = options || {};
    options.body = options.body || {};
    let fileId = super._getFileId(options);

    if (!options.body.parent && !options.body.parent.id) {
      options.body.parent = {};
      if (options.id) {
        options.body.parent.id = options.id;
        delete options.id;
      } else if (options.parentId) {
        options.body.parent.id = options.parentId;
        delete options.parentId;
      } else {
        throw new Error("A parentId or id is required for this API call.");
      }
    }

    if (options.name) {
      options.body.name = options.name;
      delete options.name;
    } else if (options.newName) {
      options.body.name = options.newName;
      delete options.newName;
    }

    let apiPath = `${BASE_PATH}/${fileId}/copy`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  updateInfo(options) {
    options = options || {};
    let fileId = super._getFileId(options);
    if (!this.client._simpleMode) {
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getFile(options, [], skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  lock(options) {
    options = options || {};
    options.body = options.body || {};
    let fileId = super._getFileId(options);

    if (options[LOCK]) {
      options.body[LOCK] = options[LOCK];
      options.body[LOCK].type = LOCK;
      delete options[LOCK];
    } else {
      options.body.lock = {
        type: LOCK
      }
    }
    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  unlock(options) {
    options = options || {};
    options.body = options.body || {};
    let fileId = super._getFileId(options);

    if (options[LOCK]) {
      delete options[LOCK];
    }
    options.body[LOCK] = null;

    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  restore(options) {
    options = options || {};
    let fileId = super._getFileId(options);

    if (options.parent) {
      options.body = options.body || {};
      options.body.parent = options.parent;
      delete options.parent;
    }

    if (options.name) {
      options.body = options.body || {};
      options.body.name = options.name;
      delete options.name;
    }

    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  delete(options) {
    options = super._objectifyString(options) || {};
    let fileId = super._getFileId(options);

    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }

  deleteVersion(options) {
    options = options || {};
    let fileId = super._getFileId(options);
    let versionId = this._getVersionId(options);

    let apiPath = `${BASE_PATH}/${fileId}/versions/${versionId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }

  permanentlyDelete(options) {
    options = super._objectifyString(options) || {};
    let fileId = super._getFileId(options);

    let apiPath = `${BASE_PATH}/${fileId}/trash`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }
}