const cluster = require('cluster');
const ci = require('../');
const path = require('path');
const fs = require('fs');
const os = require('os');
const stp = require('stp');
const console = require('console3');

const WORKER_START_DELAY = 500;

module.exports = function (cmdline) {

  //查看版本
  function version() {
    console.log(`${cmdline.NAME.toUpperCase()} ${cmdline.VERSION}${os.EOL}`);
    return true;
  }
  if (cmdline.options.has('-v')) return version();

  //显示帮助
  function help() {
    var info = fs.readFileSync(path.normalize(`${__dirname}/help.txt`)).toString();
    console.log(stp(info, {
      cmd: cmdline.NAME,
      conf: cmdline.CONFIG_FILE_NAME
    }) + os.EOL);
    return true;
  }
  if (cmdline.options.has('-h')) return help();

  //显示启动信息
  console.write('Strarting.');

  //检查 cizefile
  if (!fs.existsSync(cmdline.configFile)) {
    console.error(`${os.EOL}Not found "${cmdline.configFile}"${os.EOL}`);
    return help() && process.exit(1);
  }

  //初始化 worker 数量及记数变量
  var workerMax = Number(cmdline.options.getValue('-w')) || os.cpus().length;
  var workerCount = 0;

  //启动 workers
  function startWorkers(num) {
    cluster.fork();
    if ((--num) <= 0) return;
    setTimeout(function () {
      startWorkers(num);
    }, WORKER_START_DELAY);
  }
  startWorkers(workerMax);

  //当有 worker 断开并退出时
  cluster.on('disconnect', (worker) => {
    workerCount--;
    console.log(`#${worker.id} disconnected`);
    cluster.fork();
  });

  //当有 worker 启动成功时
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
};