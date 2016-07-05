const assert = require('assert');
const rmdir = require('rmdir');
const nokit = require('nokitjs');
const execSync = require('child_process').exec;
const ci = require('../');

nokit.Server.prototype.start = function (callback) {
  if (callback) callback(null, 'started');
};

describe('server', function () {

  var workspace = `${__dirname}/workspace`;

  var testProject, testJob, testInstance, testParams;
  before(function (done) {
    testProject = null;
    testJob = null;
    testInstance = null;
    testParams = null;
    ci.config({
      port: 8008,
      workspace: workspace,
      secret: '12345'
    });
    testProject = ci.project('test', {
      git: '/test.git'
    });
    testProject.job('test', function (self) {
      testInstance = self;
      testParams = self.params;
      self.done();
    });
    testProject.shadowJob('shadow_test', function (self) {
      testInstance = self;
      testParams = self.params;
      self.done();
    });
    ci.start(function (err) {
      if (err) throw err;
      done();
    });
  });

  describe('#job()', function () {
    it('get job', function () {
      assert.equal(testProject.job('test').name, 'test');
    });
    it('set job', function () {
      var job = testProject.job('test2', function (done) { done(); });
      assert.equal(job.name, 'test2');
    });
  });

  describe('#shadowJob()', function () {
    it('get shadowJob', function () {
      assert.equal(testProject.shadowJob('shadow_test').name, 'shadow_test');
    });
    it('set shadowJob', function () {
      var job = testProject.shadowJob('shadow_test2', 'shadow_test');
      assert.equal(job.name, 'shadow_test2');
    });
  });

  describe('#getJobs()', function () {
    it('getJobs', function () {
      var jobs = testProject.getJobs();
      assert.equal(jobs.length > 0, true);
    });
  });

  describe('#getRecords()', function () {
    it('getRecords', function (done) {
      testProject.clean({}, function (err) {
        if (err) throw err;
        testProject.invoke('test', { test: true }, function (err) {
          if (err) throw err;
          testProject.getRecords(100, 0, function (err, records) {
            if (err) throw err;
            assert.equal(records.length, 1);
            assert.equal(records[0].name, 'test');
            done();
          });
        });
      });
    });
  });

  after(function (done) {
    setTimeout(function () {
      ci.clean({}, function (err) {
        if (err) throw err;
        done();
      });
    }, 500);
  });

});