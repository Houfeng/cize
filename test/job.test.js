const assert = require('assert');
const rmdir = require('rmdir');
const nokit = require('nokitjs');
const execSync = require('child_process').exec;
const ci = require('../');
const utils = ci.utils;

nokit.Server.prototype.start = function (callback) {
  if (callback) callback(null, 'started');
};

describe('job', function () {

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

  describe('#invoke()', function () {
    it('invoke by name', function (done) {
      testParams = null;
      testProject.job('invoke', function (self) {
        self.invoke('test', self.done.bind(self));
      });
      testProject.invoke('invoke', { name: 'test' }, function (err) {
        if (err) throw err;
        assert.equal(testParams.name, 'test');
        done();
      });
    });

    it('invoke by fullname', function (done) {
      testParams = null;
      testProject.job('invoke', function (self) {
        self.invoke('test.test', self.done.bind(self));
      });
      testProject.invoke('invoke', { name: 'test' }, function (err) {
        if (err) throw err;
        assert.equal(testParams.name, 'test');
        done();
      });
    });

    it('invoke by Job', function (done) {
      testParams = null;
      testProject.job('invoke', function (self) {
        var ChildJob = self.Job.defineJob(utils.id(), function (child) {
          testParams = child.params;
          child.done();
        });
        self.invoke(ChildJob, self.done.bind(self));
      });
      testProject.invoke('invoke', { name: 'test' }, function (err) {
        if (err) throw err;
        assert.equal(testParams.name, 'test');
        done();
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