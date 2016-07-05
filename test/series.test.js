const assert = require('assert');
const rmdir = require('rmdir');
const nokit = require('nokitjs');
const execSync = require('child_process').exec;
const ci = require('../');
const utils = ci.utils;

nokit.Server.prototype.start = function (callback) {
  if (callback) callback(null, 'started');
};

describe('series', function () {

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

  it('#series', function (done) {
    testProject.job('series', ci.series([
      function (self) {
        setTimeout(function () {
          self.context.test = 1;
          self.done();
        }, 500);
      },
      function (self) {
        self.context.test = 2;
        self.done();
      }
    ]));
    testProject.invoke('series', function (err, self) {
      if (err) throw err;
      assert.equal(self.context.test, 2);
      done();
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