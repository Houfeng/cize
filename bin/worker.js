const cluster = require('cluster');
const ci = require('../');
const utils = ci.utils;
const path = require('path');

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

  //默认或 cli 配置
  ci.config({
    workspace: path.dirname(cmdline.configFile),
    port: Number(cmdline.options.getValue('-p')) || 9000,
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
