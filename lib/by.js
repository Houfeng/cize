const utils = require('./utils');
const Job = require('./job');

/**
 * 在一个 job 完成后触发
 * @param {String} triggerJobName 源 job
 * @param {Function} runable 可以执行函数
 **/
module.exports = function (triggers, runable) {
  if (!triggers) {
    throw new Error('Invalid parameter: triggers');
  }
  if (!runable) {
    throw new Error('Invalid parameter: runable');
  }
  return {
    register: function (NewJob) {
      var project = NewJob.project;
      if (utils.isString(triggers)) {
        triggers = triggers.split(',');
      }
      if (!utils.isArray(triggers)) {
        throw new Error('Invalid trigger');
      }
      triggers.forEach(function (trigger) {
        if (trigger.indexOf('.') > -1) {
          //在新上下文调执行
          project.server.on('job.end:' + trigger, function (job) {
            project.invoke(NewJob, {
              root: true,
              target: job,
              params: job.params
            });
          });
        } else {
          //在同上下文件执行
          project.on('job.end:' + trigger, function (job) {
            job.invoke(NewJob, {
              target: job,
              root: true
            });
          });
        }
      });
    },
    runable: runable
  };
};