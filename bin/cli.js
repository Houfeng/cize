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
const WORKER_START_DELAY = 250;

const cmdline = new CmdLine();

/**
 * 查看版本
 **/
if (cmdline.options.has('-v')) {
  return console.info(`${pkg.name} ${pkg.version}${os.EOL}`);
}

/**
 * 计算 confPath
 **/
var confPath = path.resolve(process.cwd(), cmdline.args[0] || './');
if (!FILE_EXP.test(confPath)) {
  confPath = path.normalize(`${confPath}/${CONF_FILE}`);
}

if (cluster.isMaster) {

  process.stdout.write('Strarting.');

  if (!fs.existsSync(confPath)) {
    console.error(`${os.EOL}Not found "${confPath}"${os.EOL}`);
    return process.exit(1);
  }

  var workerMax = Number(cmdline.options.getValue('-w') || os.cpus().length);
  var workerCount = 0;

  function startWorkers(num) {
    cluster.fork();
    if ((--num) <= 0) return;
    setTimeout(function () {
      startWorkers(num);
    }, WORKER_START_DELAY);
  }
  startWorkers(workerMax);

  cluster.on('disconnect', (worker) => {
    workerCount--;
    console.info(`#${worker.id} disconnected`);
    cluster.fork();
  });

  cluster.on('message', function (data) {
    process.stdout.write('.');
    if (!data.status) {
      console.error(os.EOL + data.message + os.EOL);
      return process.exit(1);
    }
    workerCount++;
    if (workerCount >= workerMax) {
      console.log(os.EOL + data.message);
    }
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
  ci.start(function (err, info) {
    process.send({
      status: !err,
      message: err ? err.toString() : info
    });
  });

  /**
   * 监控配置文件
   **/
  fs.watch(confPath, function () {
    cluster.worker.disconnect();
    process.exit(0);
  });

}