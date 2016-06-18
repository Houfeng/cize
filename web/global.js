/**
 * 全局应用程序类
 **/
const Global = nokit.define({

  /**
   * 在 server 启动时
   **/
  onStart: function (server, done) {
    done();
  },

  /**
   * 在 server 停止时
   **/
  onStop: function (server, done) {
    done();
  },

  /**
   * 在请求发生异常时
   **/
  onError: function (context, done) {
    done();
  },

  /**
   * 在请求到达时
   **/
  onRequest: function (context, done) {
    done();
  },

  /**
   * 在收到请求数据时
   **/
  onReceived: function (context, done) {
    done();
  },

  /**
   * 在发送响应时
   **/
  onResponse: function (context, done) {
    done();
  }

});

/**
 * export
 **/
module.exports = Global;