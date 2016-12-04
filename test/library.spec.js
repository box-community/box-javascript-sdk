import chai from 'chai';
import BoxSdk from '../lib/BoxSdk.min.js';

chai.expect();

const expect = chai.expect;

describe('Given an instance of the Box SDK', function () {
  describe('when instantiated', function () {
    let box;
    before(function() {
      box = new BoxSdk();
    });
    it('should have two properties', () => {
      expect(Object.keys(box)).to.have.length(2);
    });
    it('should have a BasicBoxClient and PersistentBoxClient', () => {
      expect(box).to.have.all.keys("_BasicBoxClient", "_PersistentBoxClient");
    });
  });
});