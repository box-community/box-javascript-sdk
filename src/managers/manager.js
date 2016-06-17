'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import InvestigateModes from '../util/investigate-modes';
import MapValues from '../util/map-values';
import FlattenDotProps from '../util/flatten-dotted-property-names';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';

export default class Manager {
  constructor(values) {
    this.ALL_VALUES = MapValues(values);
    this.FLATTENED_VALUES = FlattenDotProps(this.ALL_VALUES);
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

  _getId(options) {
    let id = '';
    if (options.id) {
      id = options.id;
      delete options.id;
    } else if (typeof options === 'string') {
      id = options;
    }
    return id;
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
      templateKey = (options.template.key !== '') ? options.template.key || options.template;
      delete options.template;
    } else if (options.templateKey || options.template_key) {
      templateKey = options.templateKey || options.template_key;
      (options.templateKey) ? delete options.templateKey : delete options.template_key;
    }
    return templateKey;
  }

  _testForMissingId(id) {
    if(id === '') {
      throw new Error('An id field is required for this API call.');
    }
  }

  _setSkipValidation(options) {
    return InvestigateModes(options, BOX_CONSTANTS.MODES.SKIP_VALIDATION) || false;
  }

  _setIgnoreModelValues(options) {
    return InvestigateModes(options, BOX_CONSTANTS.MODES.IGNORE_MODEL_VALUES) || false;
  }
}