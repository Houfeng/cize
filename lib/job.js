const Class = require('cify').Class;
const EventEmitter = require('events');

const JOB_DONE_EVENT = 'job';
const JOB_RUN_EVENT = 'run';

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
    this.runable = runable;
  },

  /**
   * 运行 Job
   * @param {Function} callback 执行回完成时的回调
   **/
  run: function (context, callback) {
    var self = this;
    return this.runable(context, function (err) {
      if (err) return callback(err);
      var eventData = {
        job: self,
        context: context
      };
      context.project.emit(`${JOB_DONE_EVENT}:${self.name}`, eventData);
      context.project.emit(JOB_DONE_EVENT, eventData);
      context.server.emit(`${JOB_DONE_EVENT}:${context.project.name}.${self.name}`, eventData);
      context.server.emit(JOB_DONE_EVENT, eventData);
      self.emit(JOB_RUN_EVENT, eventData);
    });
  }

});

module.exports = Job;