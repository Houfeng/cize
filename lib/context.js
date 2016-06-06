const Class = require('cify').Class;
const fs = require('fs');
const EventEmitter = require('events');
const Console = require('console').Console;
const mkdir = require('mkdir-p');
const utils = require('real-utils');

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
   * @param {Server} server 所属 Server
   * @param {Project} project 所属 project
   * @param {Object} params 执行参数
   **/
  constructor: function (server, project, params) {
    if (!server) {
      throw new Error('Required parameters: server');
    }
    if (!project) {
      throw new Error('Required parameters: project');
    }
    this.server = server;
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
    var theProject = this.server.project(projectName);
    var newContext = new Context(this.server, theProject, params);
    newContext.parent = this;
    return newContext;
  },

  /**
   * 在 context 初始化完成后触发
   * 1) 生成编号
   * 2) 创建执行目录
   * 3) 创建输出流
   **/
  ready: function (callback) {
    var self = this;
    self.path = [
      self.server.options.workspace,
      self.project.name,
      self.id
    ].join('/');
    mkdir(self.path, function () {
      self.out = fs.createWriteStream(`${self.path}/output.log`);
      self.console = new Console(self.out);
      if (callback) callback();
    });
  },

  /**
   * 在当前 context 上调用一个 job
   * @param {String} jobName job 名称
   * @param {Function} callback 执行完成时的回调
   **/
  invoke: function (jobName, callback) {
    var self = this;
    self.project.job(jobName).run(self, callback);
  }

});

module.exports = Context;