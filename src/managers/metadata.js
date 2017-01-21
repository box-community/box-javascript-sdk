'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import Manager from './manager';

const BASE_PATH = '/metadata_templates';
const BASE_PATH_FOLDER_METADATA = '/folders'
const BASE_PATH_FILE_METADATA = '/files'
const MODEL_VALUES = {}

export default class Metadata extends Manager {
  constructor(client) {
    super(client, MODEL_VALUES);
  }

  get(options) {
    options = options || {};
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);
    let apiPath = `${BASE_PATH}/${scope}/${templateKey}/schema`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getTemplates(options) {
    options = options || {};
    let scope = super._getScope(options);
    let apiPath = `${BASE_PATH}/${scope}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getFolderMetadata(options) {
    options = options || {};
    let folderId = super._getFolderId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH_FOLDER_METADATA}/${folderId}/metadata/${scope}/${templateKey}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getAllFolderMetadata(options) {
    options = options || {};
    let folderId = super._getFolderId(options);

    let apiPath = `${BASE_PATH_FOLDER_METADATA}/${folderId}/metadata`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getFileMetadata(options) {
    options = options || {};
    let fileId = super._getFileId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH_FILE_METADATA}/${fileId}/metadata/${scope}/${templateKey}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getAllFileMetadata(options) {
    options = options || {};
    let fileId = super._getFileId(options);

    let apiPath = `${BASE_PATH_FILE_METADATA}/${fileId}/metadata`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  createFolderMetadata(options) {
    options = options || {};
    let folderId = super._getFolderId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH_FOLDER_METADATA}/${folderId}/metadata/${scope}/${templateKey}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    options.headers = options.headers || {};
    options.headers['Content-Type'] = "application/json";
    return this.client.makeRequest(apiPath, options);
  }

  createFileMetadata(options) {
    options = options || {};
    let fileId = super._getFileId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH_FILE_METADATA}/${fileId}/metadata/${scope}/${templateKey}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    options.headers = options.headers || {};
    options.headers['Content-Type'] = "application/json";
    return this.client.makeRequest(apiPath, options);
  }

  updateFileMetadata(options) {
    options = options || {};
    let fileId = super._getFileId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH_FILE_METADATA}/${fileId}/metadata/${scope}/${templateKey}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    options.headers = options.headers || {};
    options.headers['Content-Type'] = "application/json-patch+json";
    return this.client.makeRequest(apiPath, options);
  }

  updateFolderMetadata(options) {
    options = options || {};
    let folderId = super._getFolderId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH_FOLDER_METADATA}/${folderId}/metadata/${scope}/${templateKey}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    options.headers = options.headers || {};
    options.headers['Content-Type'] = "application/json-patch+json";
    return this.client.makeRequest(apiPath, options);
  }

  deleteFolderMetadata(options) {
    options = options || {};
    let folderId = super._getFolderId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH_FOLDER_METADATA}/${folderId}/metadata/${scope}/${templateKey}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }

  deleteFileMetadata(options) {
    options = options || {};
    let fileId = super._getFileId(options);
    let scope = super._getScope(options);
    let templateKey = super._getTemplateKey(options);

    let apiPath = `${BASE_PATH_FILE_METADATA}/${fileId}/metadata/${scope}/${templateKey}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }
}

