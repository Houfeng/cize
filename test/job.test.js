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
      testProject.invoke('invoke', {
        params: { name: 'test' }
      }, function (err) {
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
      testProject.invoke('invoke', {
        params: { name: 'test' }
      }, function (err) {
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
      testProject.invoke('invoke', {
        params: { name: 'test' }
      }, function (err) {
        if (err) throw err;
        assert.equal(testParams.name, 'test');
        done();
      });
    });

  });


  describe('#beforeRun()', function () {
    it('sync refused', function (done) {
      var execed = false;
      testProject.job('test', function (self) {
        execed = true;
        self.done();
      }).beforeRun(function (self) {
        return false;
      });
      testProject.invoke('test', function (err) {
        assert.equal(err.message, 'Refused to run');
        assert.equal(execed, false);
        done();
      });
    });

    it('sync allowed', function (done) {
      var execed = false;
      testProject.job('test', function (self) {
        execed = true;
        self.done();
      }).beforeRun(function (self) {
        return;
      });
      testProject.invoke('test', function (err) {
        assert.equal(execed, true);
        done();
      });
    });

    it('async refused', function (done) {
      var execed = false;
      testProject.job('test', function (self) {
        execed = true;
        self.done();
      }).beforeRun(function (self, beforeRunDone) {
        setTimeout(function () {
          beforeRunDone(false);
        }, 10);
      });
      testProject.invoke('test', function (err) {
        assert.equal(err.message, 'Refused to run');
        assert.equal(execed, false);
        done();
      });
    });

    it('async allowed', function (done) {
      var execed = false;
      testProject.job('test', function (self) {
        execed = true;
        self.done();
      }).beforeRun(function (self, beforeRunDone) {
        setTimeout(function () {
          beforeRunDone();
        }, 10);
      });
      testProject.invoke('test', function (err) {
        assert.equal(execed, true);
        done();
      });
    });

  });

  describe('#afterRun()', function () {
    it('afterRun', function (done) {
      var execed = false;
      testProject.job('test', function (self) {
        self.done();
      }).afterRun(function (self) {
        execed = true;
      });
      testProject.invoke('test', function (err) {
        assert.equal(execed, true);
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