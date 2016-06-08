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
    register: function (server, project, job) {
      if (!utils.isArray(triggers)) {
        triggers = [triggers];
      }
      triggers.forEach(function (trigger) {
        var triggerInfo = trigger.split('.');
        if (triggerInfo.length > 1) {
          //在新上下文调执行
          server.on('job:' + trigger, function (event) {
            project.invoke(job.name, event.result);
          });
        } else {
          //在同上下文件执行
          project.on('job:' + trigger, function (event) {
            event.context.invoke(job.name);
          });
        }
      });
    },
    runable: runable
  };
};