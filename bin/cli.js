#!/usr/bin/env node

const CmdLine = require('cmdline');
const cluster = require('cluster');
const ci = require('../');
const path = require('path');
const fs = require('fs');
const utils = ci.utils;
const pkg = ci.pkg;
const os = require('os');

const CONF_FILE = `${pkg.name}file.js`;
const FILE_EXP = /\.js$/i;

const cmdline = new CmdLine();

/**
 * 查看版本
 **/
if (cmdline.options.has('-v')) {
  return console.info(`${pkg.name} ${pkg.version}`);
}

/**
 * 计算 confPath
 **/
var confPath = path.resolve(process.cwd(), cmdline.args[0] || './');
if (!FILE_EXP.test(confPath)) {
  confPath = path.normalize(`${confPath}/${CONF_FILE}`);
}
if (!fs.existsSync(confPath)) {
  console.error(`"${confPath}" not found`);
  return process.exit(1);
}

if (cluster.isMaster) {

  /**
   *  cluster
   **/
  console.log('Strarting...');
  var workerNum = Number(cmdline.options.getValue('-w') || os.cpus().length);
  for (var i = 0; i < workerNum; i++) {
    cluster.fork();
  }
  cluster.on('disconnect', (worker) => {
    console.error(`#${worker.id} disconnected`);
    cluster.fork();
  });

} else {

  /**
   * 在 worker 中启动服务
   **/
  ci.config({
    workspace: path.dirname(confPath),
    port: 9000
  });
  var confFunc = require(confPath);
  if (utils.isFunction(confFunc)) {
    confFunc(ci);
  }
  ci.start();

  /**
   * 监控配置文件
   **/
  fs.watch(confPath, function () {
    cluster.worker.disconnect();
    process.exit(0);
  });

}