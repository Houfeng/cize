const execShell = require('exec-shell');

/**
 * 执行一段 Shell 脚本
 * @param {String|Function} source 脚本源码
 **/
module.exports = function (source) {
  return function (callback) {
    var self = this;
    var shell = execShell(source, {
      params: self
    });
    shell.stdout.on('data', function (data) {
      self.console.log(data.toString());
    });
    shell.stderr.on('data', function (data) {
      self.console.error(data.toString());
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