const ci = require('../');
const utils = ci.utils;
const moduleCache = require('module')._cache;
const path = require('path');

//初始化
exports.init = function (cmdline) {
  this.cmdline = cmdline;
  this.server = ci;
};

//加载配置
exports.loadConfig = function () {
  //清理缓存
  moduleCache[this.cmdline.configFile] = null;
  //加载 cizefile 配置
  var config = require(this.cmdline.configFile);
  if (utils.isFunction(config)) {
    config(this.server);
  }
};

exports.start = function (callback) {

  //默认或 cli 配置
  this.server.config({
    configFile: this.cmdline.configFile,
    workspace: path.dirname(this.cmdline.configFile),
    port: Number(this.cmdline.options.port),
    secret: this.cmdline.options.secret,
    mode: this.cmdline.options.mode
  });

  //加载 cizefile
  this.loadConfig();

  //在 worker 中启动服务
  this.server.start(callback);
};