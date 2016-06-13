const Class = require('cify').Class;
const EventEmitter = require('events');
const mkdir = require('mkdir-p');
const utils = require('real-utils');
const async = require('async');
const Job = require('./job');

/**
 * 执行上下文，每次执行一个 job 都必须产生一个 context
 * 同 project 的 job 调用（通过 context.invoke），不会产生新的 context
 **/
const Context = new Class({

  /**
   * 继承 EventEmitter
   **/
  _extends: EventEmitter,

  /**
   * Context 的构建函数
   * @param {Project} project 所属 project
   * @param {Object} params 执行参数
   **/
  constructor: function (project, params) {
    if (!project) {
      throw new Error('Required parameters: project');
    }
    this.server = project.server;
    this.project = project;
    this.params = params || {};
    this.id = utils.newGuid();
  },

  /**
   * 创建一个新的上下文
   * @param {String} projectName 项目名称
   * @param {Object} params 执行参数
   **/
  create: function (projectName, params) {
    if (!projectName) {
      throw new Error('Required parameters: projectName');
    }
    var foundProject = this.server.project(projectName);
    if (!foundProject) {
      throw new Error('Not found project:' + projectName);
    }
    var childContext = new Context(foundProject, params || this.params);
    childContext.parent = this;
    return childContext;
  },

  /**
   * 在 context 初始化完成后触发
   * 1) 生成唯一ID
   * 2) 创建执行目录
   **/
  ready: function (callback) {
    var self = this;
    self.path = {};
    self.path.output = [
      self.server.options.workspace,
      self.project.name,
      self.id,
      'output'
    ].join('/');
    self.path.work = [
      self.server.options.workspace,
      self.project.name,
      self.id,
      'work'
    ].join('/');
    async.parallel([
      function (done) {
        mkdir(self.path.output, done)
      },
      function (done) {
        mkdir(self.path.work, done)
      }
    ], callback);
  },

  /**
   * 在当前 context 上调用一个 job
   * @param {Job|String} job job 名称或 Job 类型
   * @param {Function} callback 执行完成时的回调
   **/
  invoke: function (job, callback) {
    var self = this;
    var TheJob = null;
    if (utils.isString(job)) {
      TheJob = self.project.job(job);
    } else if (job && job.extendsOf && job.extendsOf(Job)) {
      TheJob = job;
    }
    if (!TheJob) {
      throw new Error('Invalid Job');
    }
    if (TheJob.project != self.project) {
      throw new Error('Can\'t cross project invoke in a context');
    }
    var theJob = new TheJob(self);
    return theJob._run(callback);
  }

});

module.exports = Context;