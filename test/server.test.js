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
    ci.start(function (err) {
      if (err) throw err;
      done();
    });
  });

  describe('#config()', function () {
    it('config', function () {
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
      ci.invoke('test', 'test', {
        params: { test: true }
      }, function (err) {
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
    it('getRecords', function (done) {
      ci.invoke('test', 'test', { test: true }, function (err) {
        if (err) throw err;
        ci.getRecords(1, 0, function (err, records) {
          if (err) throw err;
          assert.equal(records[0].name, 'test');
          done();
        });
      });
    });
  });

  describe('#clean()', function () {
    it('clean', function (done) {
      ci.clean({}, function (err) {
        if (err) throw err;
        ci.getRecords(1, 0, function (err, records) {
          if (err) throw err;
          assert.equal(records.length, 0);
          done();
        });
      });
    });
  });

  describe('#token', function () {
    it('createToken & verifyToken', function () {
      var token = ci.createToken(1);
      assert.equal(token != null, true);
      var payload = ci.verifyToken(token);
      assert.equal(payload != null, true);
    });
  });

  describe('#beforeInvoke()', function () {
    it('beforeInvoke()', function (done) {
      testParams = null;
      ci.beforeInvoke('test', 'test', function () {
        return false;
      });
      ci.invoke('test', 'test', { test: true }, function (err) {
        assert.equal(testParams, null);
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