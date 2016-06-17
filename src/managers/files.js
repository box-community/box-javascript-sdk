'use strict';
import BOX_CONSTANTS from '../config/box-constants';
const BASE_PATH = '/files';
const LOCK = 'lock';
const UPLOAD_PATH = 'https://upload.box.com/api/2.0/files/content';

export default class Files {
  constructor(client) {
    this.client = client;
  }

  _getFileId(options) {
    let fileId;
    if (options.fileId) {
      fileId = options.fileId;
      delete options.fileId;
    } else if (options.file && options.file.id) {
      fileId = options.file.id;
    } else if (typeof options === 'string') {
      fileId = options;
    } else {
      throw new Error('A fileId field is required for this API call.');
    }
    return fileId;
  }

  _getVersionId(options) {
    let versionId;
    if (options.id) {
      versionId = options.id;
      delete options.id;
    } else if (options.versionId) {
      versionId = options.versionId;
      delete options.versionId;
    } else {
      throw new Error("A versionId or id field is requried for this API call.")
    }
    return versionId;
  }

  get(options) {
    options = options || {};
    let fileId = this._getFileId(options);
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

  //   let fileId = this._getFileId(options);

  //   let apiPath = `${BASE_PATH}/${fileId}/content`;
  //   options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
  //   return this.client.makeRequest(apiPath, options);
  // }

  // Currently not possible due to CORS
  // Need to implement your own server endpoint
  // and upload on behalf of the user.
  upload(options) {
    options.url = UPLOAD_PATH;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    options.upload = true;
    return this.client.makeRequest(null, options);
  }

  getComments(options) {
    options = options || {};
    let fileId = this._getFileId(options);
    let apiPath = `${BASE_PATH}/${fileId}/comments`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getTasks(options) {
    options = options || {};
    let fileId = this._getFileId(options);
    let apiPath = `${BASE_PATH}/${fileId}/tasks`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getEmbedLink(options) {
    options = options || {};
    let fileId = this._getFileId(options);

    options.params = options.params || {};
    options.params.fields = 'expiring_embed_link';

    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getVersions(options) {
    options = options || {};
    let fileId = this._getFileId(options);

    let apiPath = `${BASE_PATH}/${fileId}/versions`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getThumbnail(options) {
    const MIN_HEIGHT = 'min_height';
    const MAX_HEIGHT = 'max_height';
    const MIN_WIDTH = 'min_width';
    const MAX_WIDTH = 'max_width';
    const DIMENSIONS = [MIN_HEIGHT, MAX_HEIGHT, MIN_WIDTH, MAX_WIDTH];

    options = options || {};
    options.extension = options.extension || '.png';
    options.params = options.params || {};
    let fileId = this._getFileId(options);

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
    options = options || {};
    let fileId = this._getFileId(options);

    let apiPath = `${BASE_PATH}/${fileId}/trash`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  createSharedLink(options) {
    options = options || {};
    options.body = options.body || {};
    let fileId = this._getFileId(options);

    if (options.shared_link) {
      options.body.shared_link = options.shared_link;
      delete options.shared_link;
    } else {
      options.body.shared_link = options.body.shared_link || {};
    }

    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  promoteVersion(options) {
    options = options || {};
    options.body = options.body || {};
    let fileId = this._getFileId(options);

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
    let fileId = this._getFileId(options);

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
    options.body = options.body || {};
    let fileId = this._getFileId(options);

    if (options.file) {
      options.body = options.file;
      delete options.file;
    }

    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  lock(options) {
    options = options || {};
    options.body = options.body || {};
    let fileId = this._getFileId(options);

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
    let fileId = this._getFileId(options);

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
    let fileId = this._getFileId(options);

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
    options = options || {};
    let fileId = this._getFileId(options);

    let apiPath = `${BASE_PATH}/${fileId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }

  deleteVersion(options) {
    options = options || {};
    let fileId = this._getFileId(options);
    let versionId = this._getVersionId(options);

    let apiPath = `${BASE_PATH}/${fileId}/versions/${versionId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }

  permanentlyDelete(options) {
    options = options || {};
    let fileId = this._getFileId(options);

    let apiPath = `${BASE_PATH}/${fileId}/trash`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }
}