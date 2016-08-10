const cluster = require('cluster');
const consts = require('./consts');
const console = require('console3');
const starter = require('./starter');

module.exports = function (cmdline) {

  //初始化启动器
  starter.init(cmdline);

  //发生异常时向 master 发消息
  process.on('uncaughtException', function (err) {
    process.send({
      status: false,
      message: err.toString(),
      pid: process.pid,
      workerId: cluster.worker.id
    });
  });

  //处理 master 发来的消息
  cluster.worker.on('message', function (code) {
    if (code != consts.WORKER_RLOAD_CODE) return;
    starter.loadConfig();
    console.info(`#${process.pid} to reload`);
  });

  //在 worker 中启动服务
  starter.start(function (err, info) {
    process.send({
      status: !err,
      message: err ? err.toString() : info,
      pid: process.pid,
      workerId: cluster.worker.id
    });
  });

};
