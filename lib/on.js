/**
 * 在一个 job 完成后触发
 * @param {String} triggerJobName 源 job
 * @param {Function} runable 可以执行函数
 **/
module.exports = function (triggerJobName, runable) {
  return function (context, callback) {
    context[triggerJobName.indexOf('.') > -1 ? 'server' : 'project']
      .on('job:' + triggerJobName, function () {
        runable(context, callback);
      });
  };
};