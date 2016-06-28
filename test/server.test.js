var assert = require('assert');
var ci = require('../');

describe('server', function () {
  describe('#config()', function () {
    it('init by options', function () {
      ci.config({
        workspace: '/test'
      });
      assert.equal(ci.paths.data, '/test/data/');
      assert.equal(ci.paths.works, '/test/works/');
    });
  });
});