const cluster = require('cluster');
const ci = require('../');
const utils = ci.utils;
const path = require('path');
const consts = require('./consts');
const moduleCache = require('module')._cache;
const console = require('console3');

module.exports = function (cmdline) {

  //发生异常时向 master 发消息
  process.on('uncaughtException', function (err) {
    process.send({
      status: false,
      message: err.toString(),
      pid: process.pid,
      workerId: cluster.worker.id
    });
  });

  //加载配置
  function loadConfig() {
    //清理缓存
    moduleCache[cmdline.configFile] = null;
    //加载 cizefile 配置
    var config = require(cmdline.configFile);
    if (utils.isFunction(config)) {
      config(ci);
    }
  };

  //等待重启事件
  cluster.worker.on('message', function (code) {
    if (code != consts.WORKER_RLOAD_CODE) return;
    loadConfig();
    console.info(`#${process.pid} to reload`);
  });

  //默认或 cli 配置
  ci.config({
    workspace: path.dirname(cmdline.configFile),
    port: Number(cmdline.options.getValue('-p')),
    secret: cmdline.options.getValue('-s')
  });

  //加载 cizefile
  loadConfig();

  //在 worker 中启动服务
  ci.start(function (err, info) {
    process.send({
      status: !err,
      message: err ? err.toString() : info,
      pid: process.pid,
      workerId: cluster.worker.id
    });
  });

};
