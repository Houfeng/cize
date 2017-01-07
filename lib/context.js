const Class = require('cify').Class;
const EventEmitter = require('events');
const path = require('path');
const mkdir = require('mkdir-p');
const utils = require('./utils');
const async = require('async');
const Job = require('./job');
const fs = require('fs');
const rmdir = require('rmdir');

/**
 * 执行上下文，每次执行一个 job 都必须产生一个 context
 * 同 project 的 job 调用（通过 context.invoke），不会产生新的 context
 **/
const Context = new Class({

  /**
   * 继承 EventEmitter
   **/
  $extends: EventEmitter,

  /**
   * Context 的构建函数
   * @param {Project} project 所属 project
   * @param {Object} params 执行参数
   **/
  constructor: function (project, params, parent) {
    EventEmitter.call(this);
    if (!project) {
      throw new Error('Invalid parameter: project');
    }
    this.server = project.server;
    this.project = project;
    this.parent = parent;
    this.params = params || {};
    this.id = utils.id();
    this.jobs = [];
  },

  /**
   * 创建一个新的上下文
   * @param {String} projectName 项目名称
   * @param {Object} params 执行参数
   **/
  create: function (projectName, params) {
    if (!utils.checkName(projectName)) {
      throw new Error('Invalid parameter: projectName');
    }
    var foundProject = this.server.project(projectName);
    if (!foundProject) {
      throw new Error('Not found project:' + projectName);
    }
    return new Context(foundProject, params || this.params, this);
  },

  /**
   * 获取最顶层的 parent
   **/
  deepParent: function () {
    var _parent = this;
    while (_parent.parent) {
      _parent = _parent.parent;
    }
    return _parent;
  },

  /**
   * 在 context 初始化完成后触发
   * 1) 生成唯一ID
   * 2) 创建执行目录
   **/
  ready: function (callback) {
    callback = callback || utils.NOOP;
    var self = this;
    self.paths = self.server.getContextPaths(self.id);
    async.series([
      function (next) {
        mkdir(self.paths.out, next)
      },
      function (next) {
        mkdir(self.paths.cwd, next)
      },
      function (next) {
        fs.writeFile(self.paths.params, JSON.stringify(self.params), next);
      }
    ], callback);
  },

  /**
   * 清理 context 相关的记录和磁盘文件
   **/
  clean: function (callback) {
    var self = this;
    async.parallel([
      function (done) {
        rmdir(self.paths.root, done);
      },
      function (done) {
        self.server.store.remove({
          contextId: self.id
        }, done);
      }
    ], callback);
  },

  /**
   * 在当前 context 上调用一个 job
   * @param {Job|String} job job 名称或 Job 类型
   * @param {Object} options 执行选项
   * @param {Function} callback 执行完成时的回调
   **/
  invoke: function (job, options, callback) {
    var self = this;
    if (!callback && utils.isFunction(options)) {
      callback = options;
      options = null;
    }
    callback = callback || utils.NOOP;
    options = options || {};
    var TheJob = null;
    if (utils.isString(job)) {
      TheJob = self.project.job(job);
    } else {
      TheJob = job;
    }
    if (!TheJob) {
      callback(new Error('Invalid Job'));
      return false;
    }
    if (TheJob.project != self.project) {
      callback(new Error('Can\'t cross project invoke in a context'));
      return false;
    }
    var theJob = new TheJob(self, options);
    return theJob._run(callback);
  },

  /**
   * 是否存在失败的 job
   **/
  hasFailed: function () {
    return this.jobs.some(function (job) {
      return job.status == Job.status.FAILED;
    });
  },

  /**
   * 所有错误
   **/
  errors: function (index) {
    var _errors = this.jobs.filter(function (job) {
      return !!job.error;
    }).map(function (job) {
      return job.error;
    });
    return _errors[index] || _errors;
  },

  /**
   * 所有结果
   **/
  results: function (index) {
    var _results = this.jobs.filter(function (job) {
      return !!job.result;
    }).map(function (job) {
      return job.result;
    });
    return _results[index] || _results;
  },

  /**
   * 深度检查是否存在失败的 job
   **/
  deepHasFailed: function () {
    return this.parent
      ? this.parent.deepHasFailed() && this.hasFailed()
      : this.hasFailed();
  }

});

module.exports = Context;