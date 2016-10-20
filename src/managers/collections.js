'use strict';
import BOX_CONSTANTS from '../config/box-constants';
import Manager from './manager';

const BASE_PATH = '/collections';
const MODEL_VALUES = {};

export default class Collections extends Manager {
  constructor(client) {
    super(client, MODEL_VALUES);
  }

  _getCollectionId(options) {
    let id = super._getId(options);
    if (options.collectionId || options.collection_id) {
      id = options.collectionId || options.collection_id;
      (options.collectionId) ? delete options.collectionId : delete options.collection_id;
    } else if (options.collection && options.collection.id) {
      id = options.collection.id;
    }
    super._testForMissingId(id);
    return id;
  }

  get(options) {
    options = super._objectifyString(options) || {};
    let collectionId = this._getCollectionId(options);
    let apiPath = `${BASE_PATH}/${collectionId}/items`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

  getAll(options) {
    options = options || {};
    let apiPath = `${BASE_PATH}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }
}
