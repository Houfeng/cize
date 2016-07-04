const assert = require('assert');
const ci = require('../');

describe('index', function () {

  describe('#Error', function () {
    it('toString()', function () {
      var err = new Error('test');
      err.stack = 'stack';
      assert.equal(err.toString(), 'test\nstack');
    });
  });

  describe('#global', function () {
    it('global', function () {
      assert.equal(global[ci.pkg.name], ci);
    });
  });

});