const Class = require('cify').Class;
var fs = require('fs');
const EventEmitter = require('events');

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
  },

  /**
   * 初始化 context
   * 1) 生成编号
   * 2) 创建执行目录
   * 3) 创建输出流
   **/
  _init: function () {
    if (this._initState == 2) {
      return this.emit('inited');
    }
    if (this._initState == 1) {
      return;
    }
    this._initState == 1;
    //fs.mkdir('', function () {

    this.emit('inited');
    this._initState = 2;
    //});
  },

  /**
   * 在当前 context 上调用一个 job
   * @param {String} jobName job 名称
   * @param {Function} callback 执行完成时的回调
   **/
  invoke: function (jobName, callback) {
    this.on('inited', function () {
      this.project.job(jobName).run(this, callback);
    });
    this._init();
  }

});

module.exports = Context;