'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';
import MapAllRequiredValues from '../util/map-all-required-values';
const BASE_PATH = '/web_links';
const REQUIRED_VALUES = {
  URL: 'url',
  PARENT: 'parent',
  ID: 'parent.id'
}

export default class WebLinks {
  constructor(client) {
    this.client = client;
    this.ALL_REQUIRED_VALUES = MapAllRequiredValues(REQUIRED_VALUES);
  }

  _getWebLinkId(options) {
    let id;
    if (options.id) {
      id = options.id;
      delete options.url;
    } else if (options.web_link && options.web_link.id) {
      id = options.web_link.id;
    } else if (options.web_link_id) {
      id = options.web_link_id;
      delete options.web_link_id;
    }
    else if (typeof options === 'string') {
      id = options;
    } else {
      throw new Error('An id field is required for this API call.');
    }
    return id;
  }

  _getWebLink(options, values, skipValidation) {
    if (options.web_link) {
      options.webLink = options.web_link;
      delete options.web_link;
    }
    if (options.webLink) {
      if (!skipValidation) { VerifyRequiredValues(options.webLink, values) };
      options.body = CreateRequestBody(options.webLink, values);
      delete options.webLink;
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
    let webLinkId = this._getWebLinkId(options);
    let apiPath = `${BASE_PATH}/${webLinkId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  create(options) {
    options = options || {};

  }
}