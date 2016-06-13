var CronJob = require('cron').CronJob;

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