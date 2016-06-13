import BoxHttp from './box-http';
import BasicBoxClient from './basic-box-client';

export default class SDK {
  constructor() {
    this._BasicBoxClient = BasicBoxClient;
  }
  get BasicBoxClient() {
    return this._BasicBoxClient;
  }

  math() {
    return 2 * 2;
  }
}
