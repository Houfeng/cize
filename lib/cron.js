var CronJob = require('cron').CronJob;

/**
 * 定时执行计划任务
 * @param {String} expr 时间匹配表达式
 * @param {String} runable 可以执行函数
 **/
module.exports = function (expr, runable) {
  return {
    register: function (project, NewJob) {
      var cronJob = new CronJob(expr, function () {
        project.invoke(NewJob.name);
      });
      cronJob.start();
    },
    runable: runable
  };
};