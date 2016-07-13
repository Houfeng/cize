const assert = require('assert');
const rmdir = require('rmdir');
const nokit = require('nokitjs');
const execSync = require('child_process').exec;
const ci = require('../');
const utils = ci.utils;

nokit.Server.prototype.start = function (callback) {
  if (callback) callback(null, 'started');
};

describe('by', function () {

  var workspace = `${__dirname}/workspace`;

  var testProject;
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
    ci.start(function (err) {
      if (err) throw err;
      done();
    });
  });

  it('#by name', function (done) {
    var test2Done = false;
    var test1Ins = null;
    testProject.job('test1', function (self) {
      test1Ins = self;
      self.done();
    });
    testProject.job('test2', ci.by(['test1'], function (self) {
      test2Done = true;
      self.done();
    }));
    testProject.on('job.end:test2', function (self) {
      assert.ok(self.target instanceof testProject.job('test1'));
      assert.equal(self.target, test1Ins);
      assert.equal(test2Done, true);
      done();
    });
    testProject.invoke('test1');
  });

  it('#by fullname', function (done) {
    var test2Done = false;
    testProject.job('test3', function (self) {
      self.done();
    });
    testProject.job('test4', ci.by(['test.test3'], function (self) {
      test2Done = true;
      self.done();
    }));
    testProject.on('job.end:test4', function () {
      assert.equal(test2Done, true);
      done();
    });
    testProject.invoke('test3');
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