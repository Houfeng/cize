const Class = require('cify').Class;
const EventEmitter = require('events');
const domain = require('domain');
const utils = require('real-utils');
const fs = require('fs');

const JOB_DONE_EVENT = 'job';
const JOB_RUN_EVENT = 'run';
const NOOP_FUNCTION = function () { };

/**
 * Job 看起来可以不从属于具本的 Server 和 Project，但是不同 Project 都需要一个 'some' 的 Job
 * 而「逻辑」又不一样时，会让 job 的「命名」变的麻烦。同时，在一个 job 调用另一个 job 时，就必须指定
 * PorjectName 因为 job 不知道要处理的具体项目。
 * 但是，当 Job 属于某一 Porject 时，就不会存在「命名的麻烦」，同时在 job 相互调用时，默认是在同 project
 * 中调用，当使用 projectName + jobName 时是夸项目调用
 **/

const Job = new Class({

  /**
   * 继承 EventEmitter
   **/
  _extends: EventEmitter,

  /**
   * Job 的构造函数
   * @runable {Function} 可以运行的 Function
   **/
  constructor: function (project, name, runable) {
    if (!project) {
      throw new Error('Required parameters: project');
    }
    if (!name) {
      throw new Error('Required parameters: name');
    }
    this.name = name;
    this.project = project;
    if (utils.isFunction(runable)) {
      this.runable = runable;
    } else if (utils.isFunction(runable.runable)) {
      this.runable = runable.runable;
      if (runable.register) {
        runable.register(project.server, project, this);
      }
    } else if (utils.isString(runable)) {
      var invokeInfo = runable.split('.');
      if (invokeInfo.length > 1) {
        this.runable = function (context, callback) {
          context.create(invokeInfo[0]).invoke(invokeInfo[1], callback);
        };
      } else {
        this.runable = function (context, callback) {
          return context.invoke(invokeInfo[0], callback);
        };
      }
    } else {
      throw new Error('Invalid parameters: runable');
    }
  },

  createInstance: function (context) {
    var clone = utils.clone(this);

  },

  /**
   * 运行 Job
   * @param {Function} callback 执行回完成时的回调
   **/
  run: function (context, callback) {
    var self = this;
    callback = callback || NOOP_FUNCTION;
    var dm = domain.create();
    dm.on('error', function (err) {
      return callback(err, context);
    });
    dm.run(function () {
      self.runable(context, function (err, result) {
        if (err) return callback(err, context);
        self._triggerEvent(context, result);
        callback(null, context);
      });
    });
  },

  _start: function () {
    var self = this;
    self.out = fs.createWriteStream(`${self.context.path.path}/${self.name}`);
    self.console = new Console(self.out);
  },

  /**
   * 触发一组事件
   **/
  _triggerEvent: function (context, result) {
    var self = this;
    var eventData = {
      job: self,
      context: context,
      result: result
    };
    context.project.emit(`${JOB_DONE_EVENT}:${self.name}`, eventData);
    context.project.emit(JOB_DONE_EVENT, eventData);
    context.server.emit(`${JOB_DONE_EVENT}:${context.project.name}.${self.name}`, eventData);
    context.server.emit(JOB_DONE_EVENT, eventData);
    self.emit(JOB_RUN_EVENT, eventData);
  }

});

module.exports = Job;