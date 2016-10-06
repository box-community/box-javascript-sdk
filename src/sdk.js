import BoxHttp from './box-http';
import BasicBoxClient from './basic-box-client';
import PersistentBoxClient from './persistent-box-client';

export default class SDK {
  constructor() {
    this._BasicBoxClient = BasicBoxClient;
    this._PersistentBoxClient = PersistentBoxClient;
  }
  get BasicBoxClient() {
    return this._BasicBoxClient;
  }
  get PersistentBoxClient() {
    return this._PersistentBoxClient;
  }
}
