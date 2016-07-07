const cluster = require('cluster');
const ci = require('../');
const utils = ci.utils;
const path = require('path');
const fs = require('fs');

module.exports = function (cmdline) {

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
      message: err ? err.toString() : info
    });
  });

  //监控配置文件
  fs.watch(cmdline.configFile, function () {
    cluster.worker.disconnect();
    process.exit(0);
  });

};
