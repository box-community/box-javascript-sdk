'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';
import MapValues from '../util/map-values';
import InvestigateModes from '../util/investigate-modes';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import FlattenDotProps from '../util/flatten-dotted-property-names';
const BASE_PATH = '/web_links';

const MODEL_VALUES = {
  URL: 'url',
  PARENT: 'parent',
  ID: 'parent.id',
  NAME: 'name',
  DESCRIPTION: 'description'
}

export default class WebLinks {
  constructor(client) {
    this.client = client;
    this.ALL_VALUES = MapValues(MODEL_VALUES);
    this.FLATTENED_VALUES = FlattenDotProps(this.ALL_VALUES);
  }

  _getWebLinkId(options) {
    let id;
    if (options.web_link) {
      options.webLink = options.web_link;
      delete options.web_link;
    }

    if (options.id) {
      id = options.id;
      delete options.id;
    } else if (options.webLink && options.webLink.id) {
      id = options.webLink.id;
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

  _getWebLink(options, values, skipValidation, ignoreModelValues) {
    skipValidation = skipValidation || false;
    ignoreModelValues = ignoreModelValues || false;

    if (options.webLink) {
      options.webLink = options.web_link;
      delete options.webLink;
    }
    if (options.web_link) {
      if (!skipValidation) { VerifyRequiredValues(options.webLink, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options.webLink, this.FLATTENED_VALUES) };
      options.body = CreateRequestBody(options.webLink, this.ALL_VALUES);
      delete options.webLink;
    } else if (options.body) {
      if (!skipValidation) { VerifyRequiredValues(options.body, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options.body, this.FLATTENED_VALUES); }
    } else if (options) {
      if (!skipValidation) { VerifyRequiredValues(options, values) };
      options.body = CreateRequestBody(options, this.ALL_VALUES);
    } else {
      values = values || this.ALL_VALUES;
      let requiredValuesString = values.join(', ');
      throw new Error(`Please select from the following fields when making this API call: ${requiredValuesString}`);
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
    const REQUIRED_VALUES = [ALL_VALUES.URL, ALL_VALUES.PARENT, ALL_VALUES.ID];
    let skipValidation = InvestigateModes(options, BOX_CONSTANTS.MODES.SKIP_VALIDATION) || false;
    let ignoreModelValues = InvestigateModes(options, BOX_CONSTANTS.MODES.IGNORE_MODEL_VALUES) || false;

    if (!this.client._returnsOnlyOptions) {
      this._getWebLink(options, REQUIRED_VALUES, skipValidation, ignoreModelValues);
    }

    let apiPath = `${BASE_PATH}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }
}