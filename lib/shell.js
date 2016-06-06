var execShell = require('exec-shell');

/**
 * 执行一段 Shell 脚本
 * @param {String|Function} source 脚本源码
 **/
module.exports = function (source) {
  return function (context, callback) {
    var shell = execShell(source, {
      params: context
    });
    shell.on('close', function (code) {
      if (code > 0) {
        return callback(new Error(`exit ${code}`));
      } else {
        return callback();
      }
    });
  };
};