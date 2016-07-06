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
    /**
     * 不能用 pipe，pipe 会自动关闭 stdout
     * 但是在发生异常时，还会调用 self.console.error
     * pipe 将会出来 Error: write after end
     * shell.stdout.pipe(self.stdout);
     **/
    shell.stdout.on('data', function (data) {
      if (!data || data.length < 1) return;
      self.stdout.write(data);
    });
    shell.on('exit', function (code) {
      return self.done(code > 0 ? new Error(`exit ${code}`) : null);
    });
  };
};