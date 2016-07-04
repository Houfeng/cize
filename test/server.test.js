const assert = require('assert');
const rmdir = require('rmdir');
const nokit = require('nokitjs');
const execSync = require('child_process').exec;
const ci = require('../');

nokit.Server.prototype.start = function (callback) {
  if (callback) callback(null, 'started');
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
      ci.invoke('test', 'test', { test: true }, function (err) {
        if (err) throw err;
        assert.equal(testInstance.name, 'test');
        assert.equal(testParams.test, true);
        done();
      });
    });
  });

  describe('#getProjects()', function () {
    it('getProjects', function () {
      assert.equal(ci.getProjects().length > 0, true);
    });
  });

  describe('#getRecords()', function () {
    it('getRecords', function () {
      ci.invoke('test', 'test', { test: true }, function (err) {
        if (err) throw err;
        ci.getJobRecords(1, 0, function (err, records) {
          if (err) throw err;
          assert.equal(records.length, 1);
          assert.equal(records[0].name, 'test');
        });
      });
    });
  });

  afterEach(function () {
    execSync(`rm -rf ${workspace}`);
    ci.stop();
  });

});