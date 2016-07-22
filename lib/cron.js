const CronJob = require('cron').CronJob;
const net = require('net');
const spawn = require('child_process').spawn;
const utils = require('./utils');

const LOCAL_HOST = '127.0.0.1';
const CRON_SERVER_PORT = 30405;
const DELAY_FOR_CREATE_CRON_SERVER = 1000;

if (process.env._CRON_SERVER) {

  function handle(data) {
    data.tasks.forEach(function (task) {
      var cronJob = new CronJob(task.expr, function () {
        utils.request.post(`http://${LOCAL_HOST}:${data.port}/api/projects/${task.projectName}/jobs/${task.jobName}/trigger?${data.tokenKey}=${data.token}`);
      });
      cronJob.start();
    });
  }

  var cronServer = net.createServer(function (socket) {
    socket.on('data', function (data) {
      if (cronServer.ready) return;
      handle(JSON.parse(data));
      cronServer.ready = true;
    });
  });
  cronServer.listen(CRON_SERVER_PORT);

} else {

  function createCronServer(server, callback) {
    var cronServerPorcess = spawn(process.argv[0], [__filename], {
      env: {
        _CRON_SERVER: true,
      }
    });
    cronServerPorcess.on('exit', function (code) {
      //console.warn('Cron server exit with', code);
      connectCronServer(server);
    });
    setTimeout(callback, DELAY_FOR_CREATE_CRON_SERVER);
  };

  function getCronData(server) {
    var rs = Object.create(null);
    rs.tasks = [];
    utils.each(server.projects, function (name, project) {
      utils.each(project.allJobs, function (name, job) {
        if (!job._cron_expr) return;
        rs.tasks.push({
          expr: job._cron_expr,
          projectName: job.project.name,
          jobName: job.name
        });
      });
    });
    rs.port = server.webServer.options.port;
    rs.tokenKey = `${server.pkg.name}-token`;
    rs.token = server.createToken(-1);
    return rs;
  }

  function connectCronServer(server) {
    var cronClient = new net.Socket();
    cronClient.on('error', function (err) {
      createCronServer(server, function () {
        connectCronServer(server);
      });
    });
    cronClient.connect(CRON_SERVER_PORT, LOCAL_HOST, function () {
      var data = getCronData(server);
      cronClient.write(JSON.stringify(data));
    });
  }

  function registerToServer(server) {
    server.on('ready', function () {
      connectCronServer(server);
    });
  }

  var cronServerStarted = false;

  /**
   * 定时执行计划任务
   * @param {String} expr 时间匹配表达式
   * @param {String} runable 可以执行函数
   **/
  module.exports = function (expr, runable) {
    return {
      register: function (NewJob) {
        var project = NewJob.project;
        NewJob._cron_expr = expr;
        if (cronServerStarted) return;
        cronServerStarted = true;
        registerToServer(project.server);
      },
      runable: runable
    };
  };

}