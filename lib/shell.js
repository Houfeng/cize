const execShell = require('exec-shell');
const utils = require('./utils');

/**
 * 执行一段 Shell 脚本
 * @param {String|Function} source 脚本源码
 * @param {Object} params 参数数据
 **/
module.exports = function (source, params) {
  return function (callback) {
    var self = this;
    self.params = self.params || {};
    utils.copy(params, self.params);
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