const Class = require('cify').Class;
const pkg = require('../package.json');
const Project = require('./project');
const EventEmitter = require('events');
const nokit = require('nokitjs');
const path = require('path');
const utils = require('./utils');
const Store = require('./store');
const jwt = require('jwt-simple');
const async = require('async');
const mkdir = require('mkdir-p');

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
    this.options = {};
    this.init(options);
  },

  /**
   * 初始化当前 Server 实例
   * @param {Object} options 'Server 选项'
   **/
  init: function (options) {
    options = options || {};
    options.workspace = path.normalize(options.workspace || `${process.env.TMPDIR}.${pkg.name}`);
    this.id = utils.id(options.name || options.workspace);
    this.projects = {};
    this.paths = {
      data: path.normalize(`${options.workspace}/data/`),
      works: path.normalize(`${options.workspace}/works/`)
    };
    this.secret = options.secret;
    utils.copy(options, this.options);
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
      return this.projects[projectName];
    }
    this.projects[projectName] = new Project(this, projectName, projectOptions);
    return this.projects[projectName];
  },

  /**
   * 调用指定项目的指定 Job
   * @param {String} projectName 项目名称
   * @param {String} job job 名称或数型
   * @param {Object} params 执行参数
   * @param {Function} callback 执行回完成时的回调
   **/
  invoke: function (projectName, job, params, callback) {
    callback = callback || utils.NOOP;
    if (!projectName) {
      return callback(new Error('Required parameters: projectName'));
    }
    if (!job) {
      return callback(new Error('Required parameters: job'));
    }
    if (utils.isFunction(params)) {
      callback = params;
      params = null;
    }
    return this.project(projectName).invoke(job, params, callback);
  },

  /**
   * 启动 CI 服务
   **/
  start: function (callback) {
    var self = this;
    callback = callback || utils.NOOP;
    self.store = new Store(self);
    self.webServer = new nokit.Server({
      root: path.resolve(__dirname, '../web'),
      port: self.options.port
    });
    self.webServer.ci = self;
    async.series([
      function (done) {
        mkdir(self.paths.data, done)
      },
      function (done) {
        mkdir(self.paths.works, done)
      },
      function (done) {
        self.store.connect(done);
      },
      function (done) {
        self.webServer.start(done);
      }
    ], function (err, info) {
      if (err) {
        console.error(err);
        return callback(err, info);
      }
      var lastInfo = info && info[info.length - 1];
      if (lastInfo) {
        console.log(lastInfo);
      }
    });
  },

  /**
   * 获取 job 记录
   * @param {Number} limit 指定记录条数
   * @param {Number} skip 跳过指定的条数
   * @param {Function} callback 完成时的回调函数
   **/
  getJobRecords: function (limit, skip, callback) {
    limit = limit || 100;
    skip = skip || 0;
    this.server.store.find({}, { offset: skip }, 100, ['sn', 'Z'], callback);
  },

  /**
   * 获取所有 project
   **/
  getProjects: function () {
    var self = this;
    return Object.getOwnPropertyNames(self.projects).map(function (name) {
      return self.projects[name];
    });
  },

  /**
   * 生成一个 token
   * @param {Object} payload 用于生成 token 的对象
   * @return {String} token 生成的 token
   **/
  encode: function (payload) {
    if (!payload) return;
    return jwt.encode(payload, this.secret || this.id);
  },

  /**
   * 解析一个 token
   * @param {String} token 解析一个 token 
   * @return {Object} 原始 payload
   **/
  decode: function (token) {
    if (!token) return;
    return jwt.decode(token, this.secret || this.id);
  }

});

module.exports = Server;