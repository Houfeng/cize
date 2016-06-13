var utils = require('real-utils');

/**
 * 在一个 job 完成后触发
 * @param {String} triggerJobName 源 job
 * @param {Function} runable 可以执行函数
 **/
module.exports = function (triggers, runable) {
  if (!triggers) {
    throw new Error('Required parameters: triggers');
  }
  if (!runable) {
    throw new Error('Required parameters: runable');
  }
  return {
    register: function (project, NewJob) {
      if (utils.isString(triggers)) {
        triggers = triggers.split(',');
      }
      if (!utils.isArray(triggers)) {
        throw new Error('Invalid trigger');
      }
      triggers.forEach(function (trigger) {
        if (trigger.indexOf('.') > -1) {
          //在新上下文调执行
          project.server.on('job:' + trigger, function (job) {
            project.invoke(NewJob);
          });
        } else {
          //在同上下文件执行
          project.on('job:' + trigger, function (job) {
            job.invoke(NewJob);
          });
        }
      });
    },
    runable: runable
  };
};