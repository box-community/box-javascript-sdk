
import Manager from './manager';
import BOX_CONSTANTS from '../config/box-constants';

const BASE_PATH = '/search';
const MODEL_VALUES = {};

export default class Search extends Manager {
  constructor(client) {
    super(client, MODEL_VALUES);
  }

  _objectifyStringWithQuery(options) {
    if (typeof options === 'string') {
      let query = options;
      options = { query: query };
    }
    return options;
  }

  _getQuery(options) {
    let queryFormat = 'query';
    let query = '';
    if (options.query || options.params.query) {
      options.params = options.params || {};
      query = options.query || options.params.query;
      if (options.query) { delete options.query; }
      options.params.query = query;
    } else {
      throw new Error(`An ${queryFormat} field is required for this API call. Please provide an object with a key formatted in this style: ${queryFormat}`);
    }
    return options;
  }

  search(options) {
    options = this._objectifyStringWithQuery(options) || {};
    options = this._getQuery(options);
    let apiPath = `${BASE_PATH}`;
    options.method = BOX_CONSTANTS.HTTP_VERBS.GET;
    return this.client.makeRequest(apiPath, options);
  }

}