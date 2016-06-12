const Class = require('cify').Class;
const Job = require('./job');
const EventEmitter = require('events');
const Context = require('./context');
const utils = require('real-utils');

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
    this.options = options || {};
    this.jobs = {};
  },

  /**
   * 添加或获取一个 Job 
   * @param {String} jobName job 名称
   * @param {Function} runable 可以执行的函数
   * @param {Object} options 选项
   **/
  job: function (jobName, runable, options) {
    if (!jobName) {
      throw new Error('Required parameters: jobName');
    }
    options = options || {};
    if (!runable) {
      var job = this.jobs[jobName];
      if (job) return job;
      throw new Error(`Job ${this.name}.${jobName} is undefined`);
    }
    var TheJob = Job.define(this, jobName, runable);
    TheJob.virtual = options.virtual;
    this.jobs[jobName] = TheJob;
    return this;
  },

  /**
   * 调用一个 Job 
   * @param {String} jobName job 名称
   * @param {Object} params 执行参数
   * @param {Function} callback 执行回完成时的回调
   **/
  invoke: function (jobName, params, callback) {
    if (!jobName) {
      throw new Error('Required parameters: jobName');
    }
    if (utils.isFunction(params)) {
      callback = params;
      params = null;
    }
    var context = new Context(this, params);
    context.ready(function () {
      context.invoke(jobName, callback);
    });
  }

});

module.exports = Project;