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
const rmdir = require('rmdir');
const fs = require('fs');
const os = require('os');
const exec = require('child_process').exec;

const TOKEN_DEFAULT_AGE = 60 * 60 * 12;
const TOKEN_MAX_AGE = 60 * 60 * 24 * 365 * 100;
const DEFAULT_PROT = 9000;

const Server = new Class({

  /**
   * 继承 EventEmitter
   **/
  $extends: EventEmitter,

  /**
   * Server 的构造函数
   * 可以通过 options 构造一个 CI Server 实例
   * @param {Object} options 'Server 选项'
   **/
  constructor: function (options) {
    EventEmitter.call(this);
    this.options = {};
    this.projects = {};
    this.config(options);
  },

  /**
   * 配置当前 Server 实例
   * @param {Object} options 'Server 选项'
   **/
  config: function (options) {
    utils.copy(options || {}, this.options);
    if (!this.options.workspace && this.options.configFile) {
      this.options.workspace = path.dirname(this.options.configFile);
    }
    this.id = utils.id(this.options.name || this.options.workspace);
    this.paths = {
      data: path.normalize(`${this.options.workspace}/data/`),
      works: path.normalize(`${this.options.workspace}/works/`)
    };
    this.options.port = this.options.port || DEFAULT_PROT;
    this.secret = this.options.secret || '';
  },

  /**
   * 添加或获取一个项目
   * @param {String} projectName 项目名称
   * @param {Object} projectOptions 项目选项
   **/
  project: function (projectName, projectOptions) {
    if (!utils.checkName(projectName)) {
      throw new Error('Invalid parameter: projectName');
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
   * @param {Object} options 执行选项
   * @param {Function} callback 执行回完成时的回调
   * @param {Function} startedCallback 执行启动的回调
   **/
  invoke: function (projectName, job, options, callback, startedCallback) {
    if (!callback && utils.isFunction(options)) {
      callback = options;
      options = null;
    }
    callback = callback || utils.NOOP;
    options = options || {};
    startedCallback = startedCallback || utils.NOOP;
    if (!utils.checkName(projectName) || !this.project(projectName)) {
      callback(new Error('Invalid parameter: projectName'));
      return startedCallback(false);
    }
    if (!job) {
      callback(new Error('Invalid parameter: job'));
      return startedCallback(false);
    }
    return this.project(projectName).invoke(job, options, callback, startedCallback);
  },

  /**
   * 从外部调用指定项目的指定 Job，将根据 mode 调用
   * process: 将通过 cli 调用
   * docker:  将在 docker 中通过 cli 调用
   * @param {String} projectName 项目名称
   * @param {String} job job 名称或数型
   * @param {Object} options 执行选项
   * @param {Function} callback 执行回完成时的回调
   * @param {Function} startedCallback 执行启动的回调
   **/
  externalInvoke: function (projectName, jobName, options, callback, startedCallback) {
    if (!this.options.configFile) {
      return this.invoke.apply(this, arguments);
    }
    switch (this.options.mode) {
      case 'new-process':
        var jsonParams = options.params ? JSON.stringify(options.params) : '';
        jsonParams = jsonParams.replace(/\"/igm, '\\"');
        var cmd = [
          `${pkg.name} ${this.options.configFile}`,
          `--project ${projectName}`,
          `--job ${jobName}`,
          `--params ${jsonParams}`
        ].join(' ');
        exec(cmd, callback);
        return setTimeout(function () {
          startedCallback(true)
        }, 1000);
      case 'in-process':
      default:
        return this.invoke.apply(this, arguments);
    }
  },

  /**
   * 启动 CI 服务
   **/
  start: function (callback) {
    var self = this;
    if (!this.options.workspace) {
      throw new Error('Invalid workspace');
    }
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
        if (self.options.webServer === false) {
          return done();
        }
        self.webServer.start(done);
      }
    ], function (err, info) {
      if (err) {
        console.error(err);
        self.emit('error', err);
        return callback(err);
      }
      var lastInfo = info && info[info.length - 1];
      if (lastInfo && callback == utils.NOOP) {
        console.log(`${lastInfo} #${process.pid}`);
      }
      self.emit('ready', self);
      callback(err, lastInfo);
    });
  },

  /**
   * 停止服务
   **/
  stop: function (callback) {
    return this.webServer.stop(callback);
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
  createToken: function (maxAge) {
    maxAge = maxAge || TOKEN_DEFAULT_AGE;
    if (!utils.isNumber(maxAge) || maxAge < 1) {
      maxAge = TOKEN_MAX_AGE;
    }
    var expires = Date.now() + (maxAge * 1000);
    return jwt.encode({
      expires: expires,
      uuid: utils.id()
    }, this.secret || this.id);
  },

  /**
   * 解析一个 token
   * @param {String} token 解析一个 token 
   * @return {Object} 原始 payload
   **/
  verifyToken: function (token) {
    if (!token) return;
    try {
      return jwt.decode(token, this.secret || this.id);
    } catch (err) {
      return;
    }
  },

  /**
   * 生成执行上下文路径
   **/
  getContextPaths: function (contextId) {
    var self = this;
    return {
      root: path.normalize([
        self.paths.works,
        contextId
      ].join('/')),
      out: path.normalize([
        self.paths.works,
        contextId,
        'out'
      ].join('/')),
      cwd: path.normalize([
        self.paths.works,
        contextId,
        'cwd'
      ].join('/')),
      params: path.normalize([
        self.paths.works,
        contextId,
        'out',
        'params.json'
      ].join('/'))
    };
  },

  /**
   * 获取 job 记录
   * @param {Number} limit 指定记录条数
   * @param {Number} skip 跳过指定的条数
   * @param {Function} callback 完成时的回调函数
   **/
  getRecords: function (limit, skip, callback) {
    limit = limit || 100;
    skip = skip || 0;
    this.store.find({
      refused: false,
      isShadow: false
    }, { offset: skip }, limit, ['beginTime', 'Z'], callback);
  },

  /**
   * 清理记录和磁盘文件
   **/
  clean: function (condition, callback) {
    var self = this;
    callback = callback || utils.NOOP;
    condition = condition || {};
    self.store.find(condition, function (err, records) {
      if (err || !records || records.length < 1) {
        return callback(err);
      }
      var dbTasks = records.map(function (record) {
        return function (done) {
          record.remove(done);
        };
      });
      var fsTasks = records.map(function (record) {
        return function (done) {
          //有可能一个 contextId 中有多个 job 记录，所以删除 context 目录时先检查
          var paths = self.getContextPaths(record.contextId);
          fs.exists(paths.root, function (exists) {
            if (!exists) done();
            rmdir(paths.root, done);
          });
        };
      });
      var tasks = dbTasks.concat(fsTasks);
      async.parallel(tasks, callback);
    });
  },

  /**
   * 调用前的钩子
   **/
  beforeInvoke: function (projectName, jobName, hook) {
    return this.project(projectName).beforeInvoke(jobName, hook);
  }

});

module.exports = Server;