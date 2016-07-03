var assert = require('assert');
var rmdir = require('rmdir');
var ci = require('../');

describe('server', function () {

  var workspace = `${__dirname}/.workspace`;

  var testProject, testJob, testInstance, testParams;
  beforeEach(function () {
    ci.config({
      port: 8008,
      workspace: workspace
    });
    testProject = ci.project('test', {
      git: '/test.git'
    });
    testProject.job('test', function (self) {
      testInstance = self;
      testParams = self.params;
      self.done();
    });
    ci.start();
  });

  describe('#config()', function () {
    it('init by options', function () {
      assert.equal(ci.paths.data, `${workspace}/data/`);
      assert.equal(ci.paths.works, `${workspace}/works/`);
      assert.equal(ci.options.port, 8008);
    });
  });

  describe('#project()', function () {
    it('define project', function () {
      assert.equal(testProject.name, 'test');
      assert.equal(testProject.options.git, '/test.git');
    });
  });

  describe('#invoke()', function () {
    it('define project', function (done) {
      ci.invoke('test', 'test', { test: true }, function () {
        assert.equal(testInstance.name, 'test');
        assert.equal(testParams.test, true);
        done();
      });
    });
  });

  afterEach(function () {
    ci.stop();
  });

});