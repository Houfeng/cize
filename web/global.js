var utils = require('./common/utils');

/**
 * 全局应用程序类
 **/
const Global = nokit.define({

  /**
   * 在 server 启动时
   **/
  onStart: function (server, done) {
    utils.init(server);
    done();
  }

});

/**
 * export
 **/
module.exports = Global;