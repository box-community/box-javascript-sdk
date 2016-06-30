'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import Manager from './manager';

const BASE_PATH = '/users';
const MODEL_VALUES = {}

export default class Users extends Manager {
  constructor(client) {
    super(client, MODEL_VALUES);
  }

  getCurrentUser(options) {
    options = options || {};
    let apiPath = `${BASE_PATH}/me`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getGroupMemberships(options) {
    options = options || {};
    let apiPath = `${BASE_PATH}/${userId}/memberships`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }
}