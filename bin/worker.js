const cluster = require('cluster');
const ci = require('../');
const utils = ci.utils;
const path = require('path');
const consts = require('./consts');

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

  //等待重启事件
  cluster.worker.on('message', function (code) {
    if (code != consts.WORKER_EXIT_CODE) return;
    cluster.worker.disconnect();
    setTimeout(function () {
      process.exit(1);
    }, consts.WORKER_EXIT_DELAY);
  });

  //默认或 cli 配置
  ci.config({
    workspace: path.dirname(cmdline.configFile),
    port: Number(cmdline.options.getValue('-p')),
    secret: cmdline.options.getValue('-s')
  });

  //cizefile 配置
  var conf = require(cmdline.configFile);
  if (utils.isFunction(conf)) {
    conf(ci);
  }

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
