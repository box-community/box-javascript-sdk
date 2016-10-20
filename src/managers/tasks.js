'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import VerifyRequiredValues from '../util/verify-required-values';
import CreateRequestBody from '../util/create-request-body';
import NormalizeObjectKeys from '../util/normalize-object-keys';
import Manager from './manager';

const BASE_PATH = '/tasks';
const BASE_TASK_ASSIGNMENT_PATH = '/task_assignments';
const MODEL_VALUES = {
  TASK: 'task',
  TASK_TYPE: 'task.type',
  TASK_ID: 'task.id',
  ASSIGN_TO: 'assign_to',
  ASSIGN_TO_ID: 'assign_to.id',
  ASSIGN_TO_LOGIN: 'assign_to.login',
  RESOLUTION_STATE: 'resolution_state',
  ITEM: 'item',
  ITEM_TYPE: 'item.type',
  ITEM_ID: 'item.id',
  ACTION: 'action',
  MESSAGE: 'message',
  DUE_AT: 'due_at'
}

export default class Tasks extends Manager {
  constructor(client) {
    super(MODEL_VALUES);
    this.client = client;
  }

  _getTaskId(options) {
    let id = super._getId(options);
    if (options.taskId || options.task_id) {
      id = options.taskId || options.task_id;
      (options.taskId) ? delete options.taskId : delete options.task_id;
    } else if (options.task && options.task.id) {
      id = options.task.id;
    }
    super._testForMissingId(id);
    return id;
  }

  _getTaskAssignmentId(options) {
    let id = super._getId(options);

    if (options.taskAssignment) {
      options.task_assignment = options.taskAssignment;
      delete options.taskAssignment;
    }

    if (options.taskAssignmentId || options.task_assignment_id) {
      id = options.taskId || options.task_id;
      (options.taskId) ? delete options.taskId : delete options.task_id;
    } else if (options.task_assignment && options.task_assignment.id) {
      id = options.task_assignment.id;
    }
    super._testForMissingId(id);
    return id;
  }

  _getTask(options, values, skipValidation, ignoreModelValues) {
    skipValidation = skipValidation || this.client.skipValidation || false;
    ignoreModelValues = ignoreModelValues || false;
    if (options.task) {
      if (!skipValidation) { VerifyRequiredValues(options.task, values) };
      if (!ignoreModelValues) { NormalizeObjectKeys(options.task, this.FLATTENED_VALUES); }
      options.body = CreateRequestBody(options.task, this.ALL_VALUES, ignoreModelValues);
      delete options.task;
    } else {
      super._getModel(options, values, skipValidation, ignoreModelValues);
    }
  }

  _getTaskAssignment(options, values, skipValidation, ignoreModelValues) {
    skipValidation = skipValidation || this.client.skipValidation || false;
    ignoreModelValues = ignoreModelValues || false;

    if (options.taskAssignment) {
      options.task_assignment = options.taskAssignment;
      delete options.taskAssignment;
    }

    if (options.task_assignment) {
      if (!skipValidation) { VerifyRequiredValues(options.task_assignment, values) }
      if (!ignoreModelValues) { NormalizeObjectKeys(options.task_assignment, this.FLATTENED_VALUES); }
      options.body = CreateRequestBody(options.task_assignment, this.ALL_VALUES, ignoreModelValues);
      delete options.task_assignment;
    } else {
      super._getModel(options, values, skipValidation, ignoreModelValues);
    }
  }

  get(options) {
    options = super._objectifyString(options) || {};
    let taskId = this._getTaskId(options);
    let apiPath = `${BASE_PATH}/${taskId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  create(options) {
    options = options || {};
    if (!this.client._simpleMode) {
      const REQUIRED_VALUES = [MODEL_VALUES.ITEM, MODEL_VALUES.ITEM_ID, MODEL_VALUES.ITEM_TYPE];
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getTask(options, REQUIRED_VALUES, skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_PATH}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  update(options) {
    options = options || {};
    let taskId = this._getTaskId(options);
    if (!this.client._simpleMode) {
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getTask(options, [], skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_PATH}/${taskId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  delete(options) {
    options = options || {};
    let taskId = this._getTaskId(options);
    let apiPath = `${BASE_PATH}/${taskId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }

  getTaskAssignment(options) {
    options = super._objectifyString(options) || {};
    let taskAssignmentId = this._getTaskAssignmentId(options);
    let apiPath = `${BASE_TASK_ASSIGNMENT_PATH}/${taskAssignmentId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getTaskAssignments(options) {
    options = options || {};
    let taskId = this._getTaskId(options);
    let apiPath = `${BASE_PATH}/${taskId}/assignments`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  createTaskAssignment(options) {
    options = options || {};
    if (!this.client._simpleMode) {
      const REQUIRED_VALUES = [MODEL_VALUES.TASK, MODEL_VALUES.TASK_TYPE, MODEL_VALUES.TASK_ID, MODEL_VALUES.ASSIGN_TO];
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getTaskAssignment(options, REQUIRED_VALUES, skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_TASK_ASSIGNMENT_PATH}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
    return this.client.makeRequest(apiPath, options);
  }

  updateTaskAssignment(options) {
    options = options || {};
    let taskAssignmentId = this._getTaskAssignmentId(options);
    if (!this.client._simpleMode) {
      let skipValidation = super._setSkipValidation(options);
      let ignoreModelValues = super._setIgnoreModelValues(options);

      this._getTaskAssignment(options, [], skipValidation, ignoreModelValues);
    }
    let apiPath = `${BASE_TASK_ASSIGNMENT_PATH}/${taskAssignmentId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
    return this.client.makeRequest(apiPath, options);
  }

  deleteTaskAssignment(options) {
    options = options || {};
    let taskAssignmentId = this._getTaskAssignmentId(options);
    let apiPath = `${BASE_TASK_ASSIGNMENT_PATH}/${taskAssignmentId}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
    return this.client.makeRequest(apiPath, options);
  }
}
