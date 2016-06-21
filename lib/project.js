const Class = require('cify').Class;
const Job = require('./job');
const EventEmitter = require('events');
const Context = require('./context');
const utils = require('./utils');

const Project = new Class({

  /**
   * 继承 EventEmitter
   **/
  _extends: EventEmitter,

  /**
   * Project 的构造函数
   * @param {Server} server 所属 server
   * @param {String} name 项目名称
   * @param {Object} options 项目选项
   **/
  constructor: function (server, name, options) {
    if (!server) {
      throw new Error('Required parameters: sever');
    }
    if (!name) {
      throw new Error('Required parameters: name');
    }
    this.server = server;
    this.name = name;
    this.id = utils.id(this.name);
    this.options = options || {};
    this.jobs = {};
  },

  /**
   * 添加或获取一个 Job 
   * @param {String} jobName job 名称
   * @param {Function} runable 可以执行的函数
   * @param {Object} options 选项
   **/
  job: function (jobName, runable) {
    if (!jobName) {
      throw new Error('Required parameters: jobName');
    }
    if (!runable) {
      return this.jobs[jobName];
    }
    var TheJob = this.defineJob(jobName, runable);
    this.jobs[jobName] = TheJob;
    return this;
  },

  /**
   * 解析 runable
   * @param {Object|Function|String} srcRunable 原始 runable
   **/
  _parseRunable: function (srcRunable) {
    var self = this;
    //普通 runable 函数
    if (utils.isFunction(srcRunable)) {
      return {
        runable: srcRunable
      };
    }
    //调用其它 Job
    if (utils.isString(srcRunable)) {
      return {
        runable: function (done) {
          return this.invoke(srcRunable, done);
        }
      };
    }
    //包括 runable 和 register 的对象
    if (srcRunable.runable) {
      return srcRunable;
    }
    throw new Error('Invalid parameters: runable');
  },

  /**
   * 定义一个新 Job 
   **/
  defineJob: function (name, runable) {
    if (!name) {
      throw new Error('Required parameters: name');
    }
    if (!runable) {
      throw new Error('Required parameters: runable');
    }
    var runableObj = this._parseRunable(runable);
    if (!utils.isFunction(runableObj.runable)) {
      var ChildJob = this.defineJob(utils.id(), runableObj.runable);
      runableObj.runable = function (done) {
        return this.invoke(ChildJob, done);
      };
    }
    var NewJob = new Class({
      _extends: Job,
      _runable: runableObj.runable,
      name: name,
      isAbstract: false
    });
    NewJob.__defineGetter__('name', function () {
      return name;
    });
    NewJob.project = this;
    NewJob.server = this.server;
    if (utils.isFunction(runableObj.register)) {
      runableObj.register(this, NewJob);
    }
    return NewJob;
  },

  /**
   * 调用一个 Job 
   * @param {String} job job 名称或类型
   * @param {Object} params 执行参数
   * @param {Function} callback 执行回完成时的回调
   **/
  invoke: function (job, params, callback) {
    callback = callback || utils.NOOP;
    if (!job) {
      return callback(new Error('Required parameters: job'));
    }
    if (utils.isFunction(params)) {
      callback = params;
      params = null;
    }
    var context = new Context(this, params);
    context.ready(function (err) {
      if (err) return callback(err);
      context.invoke(job, callback);
    });
  },

  /**
   * 获取 job 记录
   * @param {Number} limit 指定记录条数
   * @param {Number} skip 跳过指定的条数
   * @param {Function} callback 完成时的回调函数
   **/
  getJobRecords: function (limit, skip, callback) {
    limit = limit || 100;
    skip = skip || 0;
    this.server.store.find({
      projectName: this.project.name,
    }, { offset: skip }, 100, ['sn', 'Z'], callback);
  },

  /**
   * 获取所有 job
   **/
  getJobs: function () {
    var self = this;
    return Object.getOwnPropertyNames(self.jobs).map(function (name) {
      return self.jobs[name];
    });
  }

});

module.exports = Project;