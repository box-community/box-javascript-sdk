'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import Manager from './manager';

const BASE_PATH = '/metadata_templates';
const MODEL_VALUES = {}

export default class Tasks extends Manager {
  constructor(client) {
    super(MODEL_VALUES);
    this.client = client;
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
}