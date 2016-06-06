/**
 * 在一个 job 完成后触发
 * @param {String} triggerJobName 源 job
 * @param {Function} runable 可以执行函数
 **/
module.exports = function (trigger, runable) {
  return {
    register: function (server, project, job) {
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
    },
    runable: runable
  };
};