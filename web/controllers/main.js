const async = require('async');
const fs = require('fs');
const path = require('path');

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
    self.job.getRecord(sn, function (err, record) {
      if (err) return callback(err);
      if (!record) return self.context.notFound();
      var paths = self.ci.getContextPaths(record.contextId);
      var outFile = path.normalize(`${paths.out}/${record._id}.txt`);
      fs.readFile(outFile, function (err, data) {
        if (err) return callback(err);
        record.out = data.toString();
        self.record = record;
        callback();
      });
    });
  },

  /**
   * 默认 action
   **/
  index: function () {
    this.render("main", this);
  },

  /**
   * 显示控制台输出
   **/
  console: function () {
    if (this.record) {
      this.context.text(this.record.out, 'text/plain');
    } else {
      this.context.notFound();
    }
  },

  /**
   * 重新运行一个 job
   **/
  rerun: function () {
    var self = this;
    var paths = self.ci.getContextPaths(self.record.contextId);
    fs.readFile(paths.params, function (err, data) {
      if (err) self.context.error(err);
      self.server.ci.invoke(
        self.record.projectName,
        self.record.name,
        JSON.parse((data || '{}').toString())
      );
      self.context.send({
        status: 'ok',
        time: new Date()
      });
    });
  }

});

module.exports = MainController;