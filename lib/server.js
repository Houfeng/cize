const Class = require('cify').Class;
const pkg = require('../package.json');
const Project = require('./project');
const EventEmitter = require('events');
const nokit = require('nokitjs');
const path = require('path');
const utils = require('real-utils');

const Server = new Class({

  /**
   * 继承 EventEmitter
   **/
  _extends: EventEmitter,

  /**
   * Server 的构造函数
   * 可以通过 options 构造一个 CI Server 实例
   * @param {Object} options 'Server 选项'
   **/
  constructor: function (options) {
    this.init(options);
  },

  /**
   * 初始化当前 Server 实例
   * @param {Object} options 'Server 选项'
   **/
  init: function (options) {
    options = options || {};
    options.workspace = options.workspace || `${process.env.TMPDIR}/.${pkg.name}`;
    this.options = options;
    this.projects = {};
  },

  /**
   * 添加或获取一个项目
   * @param {String} projectName 项目名称
   * @param {Object} projectOptions 项目选项
   **/
  project: function (projectName, projectOptions) {
    if (!projectName) {
      throw new Error('Required parameters: projectName');
    }
    if (!projectOptions) {
      var project = this.projects[projectName];
      if (project) return project;
      throw new Error(`Project ${projectName} is undefined`);
    }
    this.projects[projectName] = new Project(this, projectName, projectOptions);
    return this.projects[projectName];
  },

  /**
   * 调用指定项目的指定 Job
   * @param {String} projectName 项目名称
   * @param {String} jobName job 名称
   * @param {Object} params 执行参数
   * @param {Function} callback 执行回完成时的回调
   **/
  invoke: function (projectName, jobName, params, callback) {
    if (!projectName) {
      throw new Error('Required parameters: projectName');
    }
    if (!jobName) {
      throw new Error('Required parameters: jobName');
    }
    if (utils.isFunction(params)) {
      callback = params;
      params = null;
    }
    return this.project(projectName).invoke(jobName, params, callback);
  },

  /**
   * 启动 CI 服务
   **/
  start: function (callback) {
    var self = this;
    self.webServer = new nokit.Server({
      root: path.resolve(__dirname, '../web'),
      port: self.options.port
    });
    self.webServer.ci = self;
    self.webServer.start(function (err, info) {
      if (info) console.log(info);
      if (callback) {
        if (err) console.error(err);
        callback(err, info);
      } else {
        if (err) throw err;
      }
    });
  }

});

module.exports = Server;