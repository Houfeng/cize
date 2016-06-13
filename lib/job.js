const Class = require('cify').Class;
const EventEmitter = require('events');
const domain = require('domain');
const utils = require('real-utils');
const fs = require('fs');
const Console = require('console').Console;

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
    this.context = context;
    this.server = context.server;
    this.project = context.project;
    this.params = context.params;
    this.path = context.path;
    this.outFile = `${this.path.output}/${this.name}.txt`;
    this.stdout = fs.createWriteStream(this.outFile);
    this.console = new Console(this.stdout);
  },

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
    callback = callback || NOOP_FUNCTION;
    var dm = domain.create();
    dm.on('error', function (err) {
      return callback(err, self);
    });
    dm.run(function () {
      self._runable(function (err, result) {
        if (err) return callback(err, self);
        self.stdout.end();
        self.result = result;
        self._triggerEvent();
        callback(null, self);
      });
    });
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
  }

});

module.exports = Job;