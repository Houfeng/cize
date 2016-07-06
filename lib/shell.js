const shify = require('shify');
const utils = require('./utils');

/**
 * 执行一段 Shell 脚本
 * @param {String|Function} source 脚本源码
 * @param {Object} params 参数数据
 **/
module.exports = function (source, params) {
  return function (self) {
    self.params = self.params || {};
    utils.copy(params, self.params);
    var shell = shify(source, {
      cwd: self.paths.cwd,
      env: process.env,
      params: self
    });
    shell.stdout.pipe(self.stdout);
    shell.on('exit', function (code) {
      return self.done(code > 0 ? new Error(`exit ${code}`) : null);
    });
  };
};