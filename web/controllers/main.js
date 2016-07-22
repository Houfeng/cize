const async = require('async');
const utils = require('../common/utils');

/**
 * 定义 MainController
 **/
const MainController = nokit.define({

  /**
   * 初始化方法，每次请求都会先执行 init 方法
   **/
  init: function* () {
    var self = this;
    self.ci = self.server.ci;
    async.series([
      self._loadProjects.bind(self),
      self._loadJobs.bind(self),
      self._loadLastRecordOfProjectsAndJobs.bind(self),
      function (done) {
        self.sn = self.context.params.sn;
        if (self.sn) {
          self._loadOneRecord(self.sn, done);
        } else {
          self._loadRecords(done);
        }
      }
    ], self.ready.bind(self));
  },

  /**
   * 加载项目
   **/
  _loadProjects: function (callback) {
    var self = this;
    //项目
    self.projects = self.ci.projects;
    self.projectName = self.context.params.project || Object.getOwnPropertyNames(self.projects)[0];
    if (!self.projectName) {
      return self.render('alert');
    }
    self.project = self.ci.project(self.projectName);
    if (!self.project) {
      return self.context.notFound();
    }
    if (callback) callback();
  },

  /**
   * 加载 Job
   **/
  _loadJobs: function (callback) {
    var self = this;
    //job
    self.jobs = self.project.jobs;
    self.jobName = self.context.params.job || Object.getOwnPropertyNames(self.jobs)[0];
    if (!self.jobName) {
      return self.render('alert');
    }
    self.job = self.project.job(self.jobName);
    if (!self.job) {
      return self.context.notFound();
    }
    if (callback) callback();
  },

  /**
   * 获取所有项目和当前项目下每个 job 最后一次执行记录
   **/
  _loadLastRecordOfProjectsAndJobs: function (callback) {
    var self = this;
    var items = self.ci.getProjects().concat(self.project.getJobs());
    async.parallel(items.map(function (item) {
      return function (done) {
        item.getRecords(1, 0, function (err, records) {
          if (err) return done(err);
          item.lastRecord = records[0];
          done();
        });
      };
    }), callback);
  },

  /**
   * 加载记录
   **/
  _loadRecords: function (callback) {
    var self = this;
    self.job.getRecords(100, 0, function (err, records) {
      if (err) return self.context.error(err);
      self.records = records;
      if (callback) callback();
    });
  },

  /**
   * 加载一条记录
   **/
  _loadOneRecord: function (sn, callback) {
    var self = this;
    self.job.getRecordBySn(sn, function (err, record) {
      if (err) return callback(err);
      if (!record) return self.context.notFound();
      self.record = record;
      self.record.getOut(function (err, data) {
        if (err) return callback(err);
        self.record.out = utils.ansiToHtml(data);
        callback();
      });
    });
  },

  /**
   * 默认 action
   **/
  index: function () {
    this.render("main", this);
  }

});

module.exports = MainController;