const assert = require('assert');
const rmdir = require('rmdir');
const nokit = require('nokitjs');
const execSync = require('child_process').exec;
const ci = require('../');

nokit.Server.prototype.start = function (callback) {
  if (callback) callback();
};

describe('server', function () {

  var workspace = `${__dirname}/.workspace`;

  var testProject, testJob, testInstance, testParams;
  beforeEach(function (done) {
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
    ci.start(done);
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
      //ci.start(function () {
      ci.invoke('test', 'test', { test: true }, function () {
        assert.equal(testInstance.name, 'test');
        assert.equal(testParams.test, true);
        done();
      });
      //});
    });
  });

  afterEach(function () {
    execSync(`rm -rf ${workspace}`);
  });

});