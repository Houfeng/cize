const assert = require('assert');
const rmdir = require('rmdir');
const nokit = require('nokitjs');
const execSync = require('child_process').exec;
const ci = require('../');
const utils = ci.utils;

nokit.Server.prototype.start = function (callback) {
  if (callback) callback(null, 'started');
};

describe('shell', function () {

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

  it('#shell', function (done) {
    testProject.job('shell', ci.shell(function () {
      /*
      echo 'test'
      */
    }));
    testProject.invoke('shell', function (err) {
      if (err) throw err;
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