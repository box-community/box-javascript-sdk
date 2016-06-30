'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import Manager from './manager';

const BASE_PATH = '/groups';
const BASE_MEMBERSHIP_PATH = '/group_memberships'
const MODEL_VALUES = {
  NAME: 'name',
  PROVENANCE: 'provenance',
  EXTERNAL_SYNC_IDENTIFIER: 'external_sync_identifier',
  DESCRIPTION: 'description',
  INVITABILITY_LEVEL: 'invitability_level',
  MEMBER_VIEWABILITY_LEVEL: 'member_viewability_level',
  USER: 'user',
  USER_ID: 'user.id',
  GROUP: 'group',
  GROUP_ID: 'group.id',
  ROLE: 'role'
}

export default class Groups extends Manager {
  constructor(client) {
    super(client, MODEL_VALUES);
  }

  _getGroupId(options) {
    let id = super._getId(options);
    if (options.groupId || options.group_id) {
      id = options.groupId || options.group_id;
      (options.groupId) ? delete options.groupId : delete options.group_id;
    } else if (options.group && options.group.id) {
      id = options.group.id;
    }
    super._testForMissingId(id);
    return id;
  }

  _getGroupMembershipId(options) {
    let id = super._getId(options);
    if (options.groupMembershipId || options.group_membership_id) {
      id = options.groupMembershipId || options.group_membership_id;
      (options.groupMembershipId) ? delete options.groupMembershipId : delete options.group_membership_id;
    } else if ((options.groupMembership && options.groupMembership.id) || (options.group_membership && options.group_membership.id)) {
      id = options.groupMembership.id || options.group_membership.id;
    }
    super._testForMissingId(id);
    return id;
  }

  _getGroup(options, values, skipValidation, ignoreModelValues) {
    skipValidation = skipValidation || this.client.skipValidation || false;
    ignoreModelValues = ignoreModelValues || false;
    if (options.group) {
      if (!skipValidation) { VerifyRequiredValues(options.group, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options.group, this.FLATTENED_VALUES); }
      options.body = CreateRequestBody(options.group, this.ALL_VALUES, ignoreModelValues);
      delete options.group;
    } else {
      super._getModel(options, values, skipValidation, ignoreModelValues);
    }
  }

  _getGroupMembership(options, values, skipValidation, ignoreModelValues) {
    skipValidation = skipValidation || this.client.skipValidation || false;
    ignoreModelValues = ignoreModelValues || false;

    if (options.groupMembership) {
      options.group_membership = options.groupMembership;
      delete options.groupMembership;
    }

    if (options.group_membership) {
      if (!skipValidation) { VerifyRequiredValues(options.group_membership, values) }
      if (!ignoreModelValues) { NormalizeObjectKeys(options.group_membership, this.FLATTENED_VALUES); }
      options.body = CreateRequestBody(options.group_membership, this.ALL_VALUES, ignoreModelValues);
      delete options.group_membership;
    } else {
      super._getModel(options, values, skipValidation, ignoreModelValues);
    }
  }

  get(options) {
    options = options || {};
    let groupId = this._getGroupId(options);
    let apiPath = `${BASE_PATH}/${groupId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getAll(options) {
    options = options || {};
    let apiPath = `${BASE_PATH}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  update(options) {
    options = options || {};
    let groupId = this._getGroupId(options);
    if (!this.client._simpleMode) {
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getGroup(options, [], skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_PATH}/${groupId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  getMembership(options) {
    options = options || {};
    let groupMembershipId = this._getGroupMembershipId(options);
    let apiPath = `${BASE_MEMBERSHIP_PATH}/${groupMembershipId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  updateMembership(options) {
    options = options || {};
    let groupMembershipId = this._getGroupMembershipId(options);
    if (!this.client._simpleMode) {
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getGroupMembership(options, [], skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_MEMBERSHIP_PATH}/${groupMembershipId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  deleteMembership(options) {
    options = options || {};
    let groupMembershipId = this._getGroupMembershipId(options);
    let apiPath = `${BASE_MEMBERSHIP_PATH}/${groupMembershipId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }

  getMembershipsForGroup(options) {
    options = options || {};
    let groupId = this._getGroupId(options);
    let apiPath = `${BASE_PATH}/${groupId}/memberships`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getCollaborationsForGroup(options) {
    options = options || {};
    let groupId = this._getGroupId(options);
    let apiPath = `${BASE_PATH}/${groupId}/collaborations`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }
}