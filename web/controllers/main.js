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
      var paths = self.ci.getContextPaths(record.contextId);
      var outFile = path.normalize(`${paths.out}/${record._id}.txt`);
      fs.exists(outFile, function (exists) {
        if (!exists) {
          self.record.out = 'not found';
          return callback();
        }
        fs.readFile(outFile, function (err, data) {
          if (err) return callback(err);
          self.record.out = data.toString();
          callback();
        });
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
      if (err) return self.context.send({
        status: false,
        time: new Date()
      });
      self.server.ci.invoke(
        self.record.projectName,
        self.record.name,
        JSON.parse((data || '{}').toString()),
        null,
        function (started) {
          self.context.send({
            status: started,
            time: new Date()
          });
        }
      );
    });
  }

});

module.exports = MainController;