var utils = require('real-utils');
var domain = require('domain');

/**
 * 保护执行一个函数
 * @param {Function} _try 执行的函数
 * @param {Function} _catch 错误回调函数
 **/
utils.try = function (_try, _catch) {
  if (process.env.NODE_ENV == 'development') {
    return _try();
  }
  var dm = domain.create();
  dm.on('error', _catch);
  dm.run(_try);
};

module.exports = utils;