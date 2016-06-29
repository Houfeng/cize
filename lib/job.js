const Class = require('cify').Class;
const EventEmitter = require('events');
const utils = require('./utils');
const fs = require('fs');
const Console = require('console').Console;
const path = require('path');

const JOB_BEGIN_EVENT = 'job.begin';
const JOB_END_EVENT = 'job.end';

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
      throw new Error('Invalid parameter: context');
    }
    if (this.isAbstract) return;
    this.context = context;
    this.context.jobs.push(this);
    this.id = utils.id();
    this.server = context.server;
    this.project = context.project;
    this.params = context.params;
    this.paths = context.paths;
    this.outFile = path.normalize(`${this.paths.out}/${this.id}.txt`);
    this.stdout = fs.createWriteStream(this.outFile);
    this.console = new Console(this.stdout);
  },

  /**
   * 标识为抽象类
   **/
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
    callback = callback || utils.NOOP;
    if (!self._canRun()) {
      return callback(new Error('Refuse to run'));
    }
    if (!self.name) {
      return callback(new Error('Required property: name'));
    }
    if (!self._runable) {
      return callback(new Error('Required property: runable'));
    }
    self.beginTime = Date.now();
    self._setStatus(Job.status.RUNING, function (err) {
      if (err) return callback(err, self);
      self._triggerBeginEvent();
      utils.try(function () {
        self._runable(function (err, result) {
          self._end(err, result, callback);
        });
      }, function (err) {
        self._end(err, null, callback);
      });
    });
  },

  /**
   * 结束运行
   **/
  _end: function (err, result, callback) {
    if (this._ended) {
      if (err) console.error(err.toString());
      return;
    }
    this._ended = true;
    callback = callback || NOOP_FUNCTION;
    this.error = err;
    this.result = result;
    this.endTime = Date.now();
    if (!err) {
      this._setStatus(Job.status.PASSED);
    } else {
      this._setStatus(Job.status.FAILED);
      this.console.error(err);
    }
    this._triggerEndEvent();
    this.stdout.end();
    return callback(err, this);
  },

  /**
   * 触发执行开始事件
   **/
  _triggerEndEvent: function () {
    var self = this;
    self.project.emit(`${JOB_END_EVENT}:${self.name}`, self);
    self.project.emit(JOB_END_EVENT, self);
    self.server.emit(`${JOB_END_EVENT}:${self.project.name}.${self.name}`, self);
    self.server.emit(JOB_END_EVENT, self);
  },

  /**
   * 触发执行结束事件
   **/
  _triggerBeginEvent: function () {
    var self = this;
    self.project.emit(`${JOB_BEGIN_EVENT}:${self.name}`, self);
    self.project.emit(JOB_BEGIN_EVENT, self);
    self.server.emit(`${JOB_BEGIN_EVENT}:${self.project.name}.${self.name}`, self);
    self.server.emit(JOB_BEGIN_EVENT, self);
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
  _setStatus: function (status, callback) {
    this.status = status;
    if (!this.isAbstract && !this.isVirtual()) {
      this.server.store.save(this, callback);
    } else if (callback) {
      callback();
    }
  },

  /**
   * 是否可以执行
   **/
  _canRun: function () {
    if (!this._runHooks) return true;
    return this._runHooks.some(function (hook) {
      return utils.isFunction(hook) && hook(job) === false;
    });
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
  RUNING: 100,
  PASSED: 200,
  FAILED: 300
};

/**
 * 获取 job 记录
 * @param {Number} limit 指定记录条数
 * @param {Number} skip 跳过指定的条数
 * @param {Function} callback 完成时的回调函数
 **/
Job.getRecords = function (limit, skip, callback) {
  limit = limit || 100;
  skip = skip || 0;
  this.server.store.find({
    projectName: this.project.name,
    name: this.name
  }, { offset: skip }, 100, ['beginTime', 'Z'], callback);
};

/**
 * 查找一个执行记录
 **/
Job.getRecordBySn = function (sn, callback) {
  this.server.store.findOne({
    projectName: this.project.name,
    name: this.name,
    sn: sn
  }, callback);
};

/**
 * 添加执行前 hook
 **/
Job.preRun = function (hook) {
  var proto = this.prototype;
  proto._runHooks = proto._runHooks || [];
  proto._runHooks.push(hook);
};

module.exports = Job;