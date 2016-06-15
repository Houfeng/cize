const utils = require('real-utils');
const domain = require('domain');
const md5 = require('md5');

/**
 * 保护执行一个函数
 * @param {Function} _try 执行的函数
 * @param {Function} _catch 错误回调函数
 **/
utils.try = function (_try, _catch) {
  if (!_try) return;
  if (process.env.NODE_ENV == 'development') {
    return _try();
  }
  var dm = domain.create();
  dm.on('error', function (err) {
    dm.exit();
    if (_catch) _catch(err);
  });
  dm.run(_try);
};

utils.id = function (str) {
  return md5(str || utils.newGuid()).substr(5, 16);
};

module.exports = utils;