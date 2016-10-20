'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import Manager from './manager';

const BASE_PATH = '/web_links';
const MODEL_VALUES = {
  URL: 'url',
  PARENT: 'parent',
  ID: 'parent.id',
  NAME: 'name',
  DESCRIPTION: 'description'
}

export default class WebLinks extends Manager {
  constructor(client) {
    super(MODEL_VALUES);
    this.client = client;
  }

  _getWebLinkId(options) {
    let id = super._getId(options);

    if (options.webLink) {
      options.web_link = options.webLink;
      delete options.webLink;
    }

    if (options.web_link && options.web_link.id) {
      id = options.web_link.id;
    } else if (options.webLinkId || options.web_link_id) {
      id = options.webLinkId || options.web_link_id;
      (options.webLinkId) ? delete options.webLinkId : delete options.web_link_id;
    } 
    super._testForMissingId(id);
    return id;
  }

  _getWebLink(options, values, skipValidation, ignoreModelValues) {
    skipValidation = skipValidation || this.client.skipValidation || false;
    ignoreModelValues = ignoreModelValues || false;

    if (options.webLink) {
      options.web_link = options.webLink;
      delete options.webLink;
    }

    if (options.web_link) {
      if (!skipValidation) { VerifyRequiredValues(options.webLink, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options.webLink, this.FLATTENED_VALUES) };
      options.body = CreateRequestBody(options.webLink, this.ALL_VALUES);
      delete options.web_link;
    } else {
      super._getModel(options, values, skipValidation, ignoreModelValues);
    }
  }

  get(options) {
    options = super._objectifyString(options) || {};
    let webLinkId = this._getWebLinkId(options);
    let apiPath = `${BASE_PATH}/${webLinkId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  create(options) {
    options = options || {};
    if (!this.client._simpleMode) {
      const REQUIRED_VALUES = [ALL_VALUES.URL, ALL_VALUES.PARENT, ALL_VALUES.ID];
      let skipValidation = InvestigateModes(options, BOX_CONSTANTS.MODES.SKIP_VALIDATION) || false;
      let ignoreModelValues = InvestigateModes(options, BOX_CONSTANTS.MODES.IGNORE_MODEL_VALUES) || false;

      if (!this.client._returnsOnlyOptions) {
        this._getWebLink(options, REQUIRED_VALUES, skipValidation, ignoreModelValues);
      }
    }
    let apiPath = `${BASE_PATH}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  update(options) {
    options = options || {};
    let webLinkId = this._getWebLinkId(options);
    if (!this.client._simpleMode) {
      let skipValidation = InvestigateModes(options, BOX_CONSTANTS.MODES.SKIP_VALIDATION) || false;
      let ignoreModelValues = InvestigateModes(options, BOX_CONSTANTS.MODES.IGNORE_MODEL_VALUES) || false;

      this._getWebLink(options, [], skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_PATH}/${webLinkId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  delete(options) {
    options = options || {};
    let webLinkId = this._getWebLinkId(options);
    let apiPath = `${BASE_PATH}/${webLinkId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }
}