const Class = require('cify').Class;
const EventEmitter = require('events');
const utils = require('./utils');
const fs = require('fs');
const Console = require('console').Console;
const path = require('path');

const JOB_DONE_EVENT = 'job';
const NOOP_FUNCTION = function () { };

const Job = new Class({

  /**
   * 继承 EventEmitter
   **/
  _extends: EventEmitter,

  /**
   * Job 的构造函数
   * @runable {Function} 可以运行的 Function
   **/
  constructor: function (context) {
    if (!context) {
      throw new Error('Required parameters: context');
    }
    if (this.isAbstract) return;
    context.jobs.push(this);
    this.id = utils.newGuid();
    this.context = context;
    this.server = context.server;
    this.project = context.project;
    this.params = context.params;
    this.path = context.path;
    this.outFile = path.normalize(`${this.path.output}/${this.id}.txt`);
    this.stdout = fs.createWriteStream(this.outFile);
    this.console = new Console(this.stdout);
    this._setStatus(Job.status.NORMAL);
  },

  isAbstract: true,

  /**
   * 调用其它 Job 
   * @param {String|Job} job Job 名称或类型
   * @param {Function} callback 完成时的回调
   **/
  invoke: function (job, callback) {
    if (!utils.isString(job)) {
      return this.context.invoke(job, callback);
    }
    var jobInfo = job.split('.');
    if (jobInfo.length > 1) {
      return this.context.create(jobInfo[0]).invoke(jobInfo[1], callback);
    } else {
      return this.context.invoke(jobInfo[0], callback);
    }
  },

  /**
   * 运行 Job
   * @param {Function} callback 执行回完成时的回调
   **/
  _run: function (callback) {
    var self = this;
    if (!self.name) {
      throw new Error('Required property: name');
    }
    if (!self._runable) {
      throw new Error('Required property: runable');
    }
    utils.try(function () {
      self.beginTime = Date.now();
      self._setStatus(Job.status.RUNING);
      self._runable(function (err, result) {
        self._end(err, result, callback);
      });
    }, function (err) {
      self._end(err, null, callback);
    });
  },

  /**
   * 结束运行
   **/
  _end: function (err, result, callback) {
    callback = callback || NOOP_FUNCTION;
    this.error = err;
    this.result = result;
    this.endTime = Date.now();
    if (!err) {
      this._setStatus(Job.status.PASSED);
      this._triggerEvent();
    } else {
      this._setStatus(Job.status.FAILED);
      this.console.error(err);
    }
    this.stdout.end();
    return callback(err, this);
  },

  /**
   * 触发一组事件
   **/
  _triggerEvent: function () {
    var self = this;
    self.project.emit(`${JOB_DONE_EVENT}:${self.name}`, self);
    self.project.emit(JOB_DONE_EVENT, self);
    self.server.emit(`${JOB_DONE_EVENT}:${self.project.name}.${self.name}`, self);
    self.server.emit(JOB_DONE_EVENT, self);
  },

  /**
   * 是否是一个虚拟 job 实例
   **/
  isVirtual: function () {
    return !(this.project.job(this.name));
  },

  /**
   * 设置实例状态
   **/
  _setStatus: function (status) {
    this.status = status;
    this.save();
  },

  /**
   * 保存实例执行记录
   **/
  save: function () {
    this.server.store.save(this);
  }

});

/**
 * 是否是一个虚拟 Job 类型
 **/
Job.isVirtual = function () {
  return !(this.project.job(this.name));
};

/**
 * Job 实例的状态
 **/
Job.status = {
  NORMAL: 0,
  RUNING: 1,
  PASSED: 2,
  FAILED: 3
};

module.exports = Job;